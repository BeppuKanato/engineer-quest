import { NextFunction, Request, Response } from "express";

import { AppError } from "../error/appError";
import { getCollectionByUser } from "../service/collection.service";
import { getQuestKnowledgeCards, getUnitCardKeywords } from "../service/knowledgeCardReference.service";

const getAuthUser = (req: Request) => {
  const user = req.authUser;

  if (!user) {
    throw new AppError(401, "UNAUTHORIZED", "Unauthorized");
  }

  return user;
};

const referenceController = (kind: "questId" | "courseId") => async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = getAuthUser(req), id = req.params[kind];
    if (typeof id !== "string" || !id.trim()) throw new AppError(400, "INVALID_CARD_REFERENCE", "対象を指定してください。");
    res.status(200).json(await (kind === "questId" ? getQuestKnowledgeCards(user.id, id) : getUnitCardKeywords(user.id, id)));
  } catch (error) { next(error); }
};
export const getQuestKnowledgeCardsController = referenceController("questId");
export const getUnitCardKeywordsController = referenceController("courseId");

export const getCollectionController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = await getCollectionByUser(getAuthUser(req));

    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};
