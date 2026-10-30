#!/usr/bin/env bash
set -euo pipefail

: "${GCP_PROJECT_ID:?GCP_PROJECT_ID is required}"
: "${SOURCE_SHA:?SOURCE_SHA is required}"
: "${GITHUB_RUN_ID:?GITHUB_RUN_ID is required}"
: "${GITHUB_RUN_ATTEMPT:?GITHUB_RUN_ATTEMPT is required}"
: "${REGION:?REGION is required}"
: "${REPO_NAME:?REPO_NAME is required}"
: "${GITHUB_OUTPUT:?GITHUB_OUTPUT is required}"
: "${GITHUB_STEP_SUMMARY:?GITHUB_STEP_SUMMARY is required}"

# Refuse accidental reuse against the production services.
[[ "${BACK_SERVICE:-}" == "engineer-quest-back-dev" ]]
[[ "${FRONT_SERVICE:-}" == "engineer-quest-front-dev" ]]

image_root="${REGION}-docker.pkg.dev/${GCP_PROJECT_ID}/${REPO_NAME}/dev"
image_tag="${SOURCE_SHA}-${GITHUB_RUN_ID}-${GITHUB_RUN_ATTEMPT}"
back_image="${image_root}/back:${image_tag}"
front_image="${image_root}/front:${image_tag}"
back_account="engineer-quest-dev-back@${GCP_PROJECT_ID}.iam.gserviceaccount.com"
front_account="engineer-quest-dev-front@${GCP_PROJECT_ID}.iam.gserviceaccount.com"

gcloud_flags=(--project "$GCP_PROJECT_ID" --quiet)
run_flags=("${gcloud_flags[@]}" --region "$REGION")

get_front_origins() {
  local service_url="$1" project_number deterministic_url
  project_number="$(gcloud run services describe "$FRONT_SERVICE" "${run_flags[@]}" --format='value(metadata.namespace)')" || return 1
  if [[ ! "$project_number" =~ ^[0-9]+$ ]]; then
    echo '::error::Cloud Run did not return a numeric project namespace.' >&2
    return 1
  fi
  deterministic_url="https://${FRONT_SERVICE}-${project_number}.${REGION}.run.app"
  printf '%s' "$service_url"
  if [[ "$deterministic_url" != "$service_url" ]]; then
    printf ',%s' "$deterministic_url"
  fi
}

wait_for_build() {
  local build_id="$1" status
  [[ -n "$build_id" ]]
  for ((attempt = 0; attempt < 150; attempt++)); do
    status="$(gcloud builds describe "$build_id" "${gcloud_flags[@]}" --format='value(status)')"
    echo "Cloud Build ${build_id}: ${status}"
    case "$status" in
      SUCCESS) return 0 ;;
      FAILURE|INTERNAL_ERROR|CANCELLED|TIMEOUT|EXPIRED)
        echo "::error::Cloud Build ${build_id} failed: ${status}"
        return 1
        ;;
    esac
    sleep 10
  done
  echo "::error::Timed out waiting for Cloud Build ${build_id}."
  return 1
}

# Preserve CORS on subsequent deployments; the first deployment gets its real
# frontend origin after the frontend has been created below.
front_url="$(gcloud run services list "${run_flags[@]}" \
  --filter="metadata.name=${FRONT_SERVICE}" --format='value(status.url)')"
allowed_origins="https://development-not-configured.invalid"
if [[ -n "$front_url" ]]; then
  allowed_origins="$(get_front_origins "$front_url")"
fi

back_build_id="$(gcloud builds submit ./back "${gcloud_flags[@]}" \
  --tag "$back_image" --timeout=1200s --async --format='value(id)')"
wait_for_build "$back_build_id"

gcloud run deploy "$BACK_SERVICE" "${run_flags[@]}" \
  --image "$back_image" \
  --service-account "$back_account" \
  --platform managed --allow-unauthenticated --ingress all \
  --port 8080 --cpu 1 --memory 512Mi --min 0 --max 2 \
  --concurrency 20 --timeout 300 --cpu-throttling \
  --update-env-vars "^@^NODE_ENV=production@GOOGLE_CLOUD_PROJECT=${GCP_PROJECT_ID}@ALLOWED_ORIGINS=${allowed_origins}" \
  --update-secrets "DATABASE_URL=DATABASE_URL_DEV:latest,OPENAI_API_KEY=OPENAI_API_KEY_DEV:latest"

back_url="$(gcloud run services describe "$BACK_SERVICE" "${run_flags[@]}" --format='value(status.url)')"
[[ "$back_url" == https://* ]]
api_url="${back_url}/api"

front_build_id="$(gcloud builds submit ./front "${gcloud_flags[@]}" \
  --config .github/cloudbuild/front-dev.yaml \
  --substitutions "_IMAGE=${front_image},_NEXT_PUBLIC_API_BASE_URL=${api_url}" \
  --timeout=1200s --async --format='value(id)')"
wait_for_build "$front_build_id"

gcloud run deploy "$FRONT_SERVICE" "${run_flags[@]}" \
  --image "$front_image" \
  --service-account "$front_account" \
  --platform managed --allow-unauthenticated --ingress all \
  --port 8080 --cpu 1 --memory 512Mi --min 0 --max 2 \
  --concurrency 20 --timeout 300 --cpu-throttling \
  --update-env-vars "NODE_ENV=production,NEXT_PUBLIC_API_BASE_URL=${api_url},INTERNAL_API_BASE_URL=${api_url}"

front_url="$(gcloud run services describe "$FRONT_SERVICE" "${run_flags[@]}" --format='value(status.url)')"
[[ "$front_url" == https://* ]]
allowed_origins="$(get_front_origins "$front_url")"
gcloud run services update "$BACK_SERVICE" "${run_flags[@]}" \
  --update-env-vars "^@^ALLOWED_ORIGINS=${allowed_origins}"

curl --fail --silent --show-error --retry 5 --retry-all-errors --max-time 60 "${back_url}/health"
curl --fail --silent --show-error --retry 5 --retry-all-errors --max-time 60 \
  --output /dev/null "${front_url}/auth/login"
bash .github/scripts/check-dev-cors.sh "$back_url" "$allowed_origins"

echo "url=${front_url}" >> "$GITHUB_OUTPUT"
{
  echo '## Development deployment'
  echo "- Commit: ${SOURCE_SHA}"
  echo "- Frontend: ${front_url}"
  echo "- Backend: ${back_url}"
  echo "- Allowed frontend origins: ${allowed_origins}"
  echo '- Database: existing Neon engineer-quest-dev via DATABASE_URL_DEV'
  echo '- Firebase: existing project; add the frontend hostname to authorized domains.'
  echo '- Database migrations and seeds are not run by this workflow.'
} >> "$GITHUB_STEP_SUMMARY"
