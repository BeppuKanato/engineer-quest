// #541: 教材基準データ。各フェーズの図、質問、コードの唯一のフロント正本。
export const weightedMaterials = {
  "dijkstra": {
    "courseId": "course-algorithm-dijkstra-v1",
    "title": "ダイクストラ法",
    "intro": "道ごとに異なる移動コストを足し合わせ、最小コストの経路を見つける方法を学びます。",
    "phases": [
      {
        "phase": 1,
        "id": "dijkstra-motivation",
        "shortName": "導入",
        "formalName": "導入",
        "transitionOut": "bridge"
      },
      {
        "phase": 2,
        "id": "dijkstra-execution",
        "shortName": "動きの説明",
        "formalName": "動きの説明",
        "transitionOut": "bridge",
        "bridge": "候補を選ぶ順番と移動コストの更新を追ってみましょう。",
        "cardRarity": "RARE"
      },
      {
        "phase": 3,
        "id": "dijkstra-check",
        "shortName": "動きの確認",
        "formalName": "動きの確認問題",
        "transitionOut": "result",
        "bridge": "図を見て、次の操作と更新後のコストを確かめましょう。",
        "result": {
          "heading": "動きの確認問題が終わりました"
        }
      },
      {
        "phase": 4,
        "id": "dijkstra-code-mapping",
        "shortName": "動きとコード",
        "formalName": "動きとコードの対応",
        "transitionOut": "bridge",
        "bridge": "今の動きがコードでどう表現されるか見てみましょう。"
      },
      {
        "phase": 5,
        "id": "dijkstra-code-check",
        "shortName": "コードの確認",
        "formalName": "コードの確認問題",
        "transitionOut": "result",
        "bridge": "コードの空欄を埋めて、各処理の役割を確かめましょう。",
        "cardRarity": "COMMON",
        "result": {
          "heading": "コードの確認問題が終わりました"
        }
      },
      {
        "phase": 6,
        "id": "dijkstra-consolidation",
        "shortName": "応用問題",
        "formalName": "応用問題",
        "transitionOut": "result",
        "bridge": "異なる地図や境界ケースで考え方を使ってみましょう。",
        "result": {
          "heading": "応用問題が終わりました"
        }
      },
      {
        "phase": 7,
        "id": "dijkstra-implementation",
        "shortName": "自分で実装",
        "formalName": "自分で実装",
        "transitionOut": "final",
        "bridge": "最後は最短経路を返すプログラムを自分で完成させましょう。",
        "cardRarity": "EPIC"
      }
    ],
    "motivation": {
      "version": 1,
      "kind": "step-sequence",
      "id": "dijkstra-motivation",
      "phase": 1,
      "intervalMs": 3500,
      "steps": [
        {
          "id": "intro-1",
          "caption": "出発点AからゴールFへ、なるべく少ない移動コストでたどり着くにはどうすればいいでしょう？",
          "canvas": {
            "data": {
              "mode": "dijkstra",
              "graph": {
                "nodes": [
                  {
                    "id": "A",
                    "x": 0,
                    "y": 0
                  },
                  {
                    "id": "B",
                    "x": 2,
                    "y": 0
                  },
                  {
                    "id": "C",
                    "x": 0,
                    "y": 1
                  },
                  {
                    "id": "D",
                    "x": 4,
                    "y": 0
                  },
                  {
                    "id": "E",
                    "x": 3,
                    "y": 1
                  },
                  {
                    "id": "F",
                    "x": 6,
                    "y": 0
                  }
                ],
                "edges": [
                  {
                    "from": "A",
                    "to": "B",
                    "weight": 2
                  },
                  {
                    "from": "A",
                    "to": "C",
                    "weight": 1
                  },
                  {
                    "from": "B",
                    "to": "D",
                    "weight": 2
                  },
                  {
                    "from": "B",
                    "to": "E",
                    "weight": 2
                  },
                  {
                    "from": "C",
                    "to": "E",
                    "weight": 5
                  },
                  {
                    "from": "D",
                    "to": "F",
                    "weight": 2
                  },
                  {
                    "from": "E",
                    "to": "F",
                    "weight": 5
                  }
                ]
              },
              "heuristic": null,
              "introStage": 1,
              "introPath": []
            },
            "state": {
              "operation": "init",
              "from": null,
              "to": null,
              "candidate": null,
              "distances": {
                "A": 0,
                "B": null,
                "C": null,
                "D": null,
                "E": null,
                "F": null
              },
              "predecessors": {},
              "frontier": [
                "A"
              ],
              "selected": []
            },
            "highlights": []
          }
        },
        {
          "id": "intro-2",
          "caption": "AからC、Eを経由すると移動コストは11です。",
          "canvas": {
            "data": {
              "mode": "dijkstra",
              "graph": {
                "nodes": [
                  {
                    "id": "A",
                    "x": 0,
                    "y": 0
                  },
                  {
                    "id": "B",
                    "x": 2,
                    "y": 0
                  },
                  {
                    "id": "C",
                    "x": 0,
                    "y": 1
                  },
                  {
                    "id": "D",
                    "x": 4,
                    "y": 0
                  },
                  {
                    "id": "E",
                    "x": 3,
                    "y": 1
                  },
                  {
                    "id": "F",
                    "x": 6,
                    "y": 0
                  }
                ],
                "edges": [
                  {
                    "from": "A",
                    "to": "B",
                    "weight": 2
                  },
                  {
                    "from": "A",
                    "to": "C",
                    "weight": 1
                  },
                  {
                    "from": "B",
                    "to": "D",
                    "weight": 2
                  },
                  {
                    "from": "B",
                    "to": "E",
                    "weight": 2
                  },
                  {
                    "from": "C",
                    "to": "E",
                    "weight": 5
                  },
                  {
                    "from": "D",
                    "to": "F",
                    "weight": 2
                  },
                  {
                    "from": "E",
                    "to": "F",
                    "weight": 5
                  }
                ]
              },
              "heuristic": null,
              "introStage": 2,
              "introPath": [
                "A",
                "C",
                "E",
                "F"
              ]
            },
            "state": {
              "operation": "init",
              "from": null,
              "to": null,
              "candidate": null,
              "distances": {
                "A": 0,
                "B": null,
                "C": null,
                "D": null,
                "E": null,
                "F": null
              },
              "predecessors": {},
              "frontier": [
                "A"
              ],
              "selected": []
            },
            "highlights": []
          }
        },
        {
          "id": "intro-3",
          "caption": "AからB、Dを経由すると同じ3本の道でもコストは6になります。",
          "canvas": {
            "data": {
              "mode": "dijkstra",
              "graph": {
                "nodes": [
                  {
                    "id": "A",
                    "x": 0,
                    "y": 0
                  },
                  {
                    "id": "B",
                    "x": 2,
                    "y": 0
                  },
                  {
                    "id": "C",
                    "x": 0,
                    "y": 1
                  },
                  {
                    "id": "D",
                    "x": 4,
                    "y": 0
                  },
                  {
                    "id": "E",
                    "x": 3,
                    "y": 1
                  },
                  {
                    "id": "F",
                    "x": 6,
                    "y": 0
                  }
                ],
                "edges": [
                  {
                    "from": "A",
                    "to": "B",
                    "weight": 2
                  },
                  {
                    "from": "A",
                    "to": "C",
                    "weight": 1
                  },
                  {
                    "from": "B",
                    "to": "D",
                    "weight": 2
                  },
                  {
                    "from": "B",
                    "to": "E",
                    "weight": 2
                  },
                  {
                    "from": "C",
                    "to": "E",
                    "weight": 5
                  },
                  {
                    "from": "D",
                    "to": "F",
                    "weight": 2
                  },
                  {
                    "from": "E",
                    "to": "F",
                    "weight": 5
                  }
                ]
              },
              "heuristic": null,
              "introStage": 3,
              "introPath": [
                "A",
                "B",
                "D",
                "F"
              ]
            },
            "state": {
              "operation": "init",
              "from": null,
              "to": null,
              "candidate": null,
              "distances": {
                "A": 0,
                "B": null,
                "C": null,
                "D": null,
                "E": null,
                "F": null
              },
              "predecessors": {},
              "frontier": [
                "A"
              ],
              "selected": []
            },
            "highlights": []
          }
        },
        {
          "id": "intro-4",
          "caption": "まずは出発点の隣へ進むコストを記録します。",
          "canvas": {
            "data": {
              "mode": "dijkstra",
              "graph": {
                "nodes": [
                  {
                    "id": "A",
                    "x": 0,
                    "y": 0
                  },
                  {
                    "id": "B",
                    "x": 2,
                    "y": 0
                  },
                  {
                    "id": "C",
                    "x": 0,
                    "y": 1
                  },
                  {
                    "id": "D",
                    "x": 4,
                    "y": 0
                  },
                  {
                    "id": "E",
                    "x": 3,
                    "y": 1
                  },
                  {
                    "id": "F",
                    "x": 6,
                    "y": 0
                  }
                ],
                "edges": [
                  {
                    "from": "A",
                    "to": "B",
                    "weight": 2
                  },
                  {
                    "from": "A",
                    "to": "C",
                    "weight": 1
                  },
                  {
                    "from": "B",
                    "to": "D",
                    "weight": 2
                  },
                  {
                    "from": "B",
                    "to": "E",
                    "weight": 2
                  },
                  {
                    "from": "C",
                    "to": "E",
                    "weight": 5
                  },
                  {
                    "from": "D",
                    "to": "F",
                    "weight": 2
                  },
                  {
                    "from": "E",
                    "to": "F",
                    "weight": 5
                  }
                ]
              },
              "heuristic": null,
              "introStage": 4,
              "introPath": []
            },
            "state": {
              "operation": "relax",
              "from": "A",
              "to": "C",
              "candidate": 1,
              "distances": {
                "A": 0,
                "B": 2,
                "C": 1,
                "D": null,
                "E": null,
                "F": null
              },
              "predecessors": {
                "B": "A",
                "C": "A"
              },
              "frontier": [
                "C",
                "B"
              ],
              "selected": [
                "A"
              ]
            },
            "highlights": [
              {
                "from": "A",
                "to": "C"
              }
            ]
          }
        },
        {
          "id": "intro-5",
          "caption": "今のところ最も小さい移動コストの候補から選ぶ方法がダイクストラ法です。",
          "canvas": {
            "data": {
              "mode": "dijkstra",
              "graph": {
                "nodes": [
                  {
                    "id": "A",
                    "x": 0,
                    "y": 0
                  },
                  {
                    "id": "B",
                    "x": 2,
                    "y": 0
                  },
                  {
                    "id": "C",
                    "x": 0,
                    "y": 1
                  },
                  {
                    "id": "D",
                    "x": 4,
                    "y": 0
                  },
                  {
                    "id": "E",
                    "x": 3,
                    "y": 1
                  },
                  {
                    "id": "F",
                    "x": 6,
                    "y": 0
                  }
                ],
                "edges": [
                  {
                    "from": "A",
                    "to": "B",
                    "weight": 2
                  },
                  {
                    "from": "A",
                    "to": "C",
                    "weight": 1
                  },
                  {
                    "from": "B",
                    "to": "D",
                    "weight": 2
                  },
                  {
                    "from": "B",
                    "to": "E",
                    "weight": 2
                  },
                  {
                    "from": "C",
                    "to": "E",
                    "weight": 5
                  },
                  {
                    "from": "D",
                    "to": "F",
                    "weight": 2
                  },
                  {
                    "from": "E",
                    "to": "F",
                    "weight": 5
                  }
                ]
              },
              "heuristic": null,
              "introStage": 5,
              "introPath": []
            },
            "state": {
              "operation": "relax",
              "from": "A",
              "to": "C",
              "candidate": 1,
              "distances": {
                "A": 0,
                "B": 2,
                "C": 1,
                "D": null,
                "E": null,
                "F": null
              },
              "predecessors": {
                "B": "A",
                "C": "A"
              },
              "frontier": [
                "C",
                "B"
              ],
              "selected": [
                "A"
              ]
            },
            "highlights": [
              {
                "from": "A",
                "to": "C"
              }
            ]
          }
        }
      ]
    },
    "execution": {
      "version": 1,
      "kind": "step-sequence",
      "id": "dijkstra-execution",
      "phase": 2,
      "intervalMs": 3500,
      "steps": [
        {
          "id": "1-init-start-none",
          "caption": "出発点Aまでの移動コストを0として、候補に追加します。",
          "canvas": {
            "data": {
              "mode": "dijkstra",
              "graph": {
                "nodes": [
                  {
                    "id": "A",
                    "x": 0,
                    "y": 0
                  },
                  {
                    "id": "B",
                    "x": 2,
                    "y": 0
                  },
                  {
                    "id": "C",
                    "x": 0,
                    "y": 1
                  },
                  {
                    "id": "D",
                    "x": 4,
                    "y": 0
                  },
                  {
                    "id": "E",
                    "x": 3,
                    "y": 1
                  },
                  {
                    "id": "F",
                    "x": 6,
                    "y": 0
                  }
                ],
                "edges": [
                  {
                    "from": "A",
                    "to": "B",
                    "weight": 2
                  },
                  {
                    "from": "A",
                    "to": "C",
                    "weight": 1
                  },
                  {
                    "from": "B",
                    "to": "D",
                    "weight": 2
                  },
                  {
                    "from": "B",
                    "to": "E",
                    "weight": 2
                  },
                  {
                    "from": "C",
                    "to": "E",
                    "weight": 5
                  },
                  {
                    "from": "D",
                    "to": "F",
                    "weight": 2
                  },
                  {
                    "from": "E",
                    "to": "F",
                    "weight": 5
                  }
                ]
              },
              "heuristic": null
            },
            "state": {
              "operation": "init",
              "from": null,
              "to": null,
              "candidate": null,
              "distances": {
                "A": 0,
                "B": null,
                "C": null,
                "D": null,
                "E": null,
                "F": null
              },
              "predecessors": {},
              "frontier": [
                "A"
              ],
              "selected": []
            },
            "highlights": []
          }
        },
        {
          "id": "2-select-A-none",
          "caption": "候補の中で移動コストが最小のA（0）を選びます。",
          "canvas": {
            "data": {
              "mode": "dijkstra",
              "graph": {
                "nodes": [
                  {
                    "id": "A",
                    "x": 0,
                    "y": 0
                  },
                  {
                    "id": "B",
                    "x": 2,
                    "y": 0
                  },
                  {
                    "id": "C",
                    "x": 0,
                    "y": 1
                  },
                  {
                    "id": "D",
                    "x": 4,
                    "y": 0
                  },
                  {
                    "id": "E",
                    "x": 3,
                    "y": 1
                  },
                  {
                    "id": "F",
                    "x": 6,
                    "y": 0
                  }
                ],
                "edges": [
                  {
                    "from": "A",
                    "to": "B",
                    "weight": 2
                  },
                  {
                    "from": "A",
                    "to": "C",
                    "weight": 1
                  },
                  {
                    "from": "B",
                    "to": "D",
                    "weight": 2
                  },
                  {
                    "from": "B",
                    "to": "E",
                    "weight": 2
                  },
                  {
                    "from": "C",
                    "to": "E",
                    "weight": 5
                  },
                  {
                    "from": "D",
                    "to": "F",
                    "weight": 2
                  },
                  {
                    "from": "E",
                    "to": "F",
                    "weight": 5
                  }
                ]
              },
              "heuristic": null
            },
            "state": {
              "operation": "select",
              "from": "A",
              "to": null,
              "candidate": null,
              "distances": {
                "A": 0,
                "B": null,
                "C": null,
                "D": null,
                "E": null,
                "F": null
              },
              "predecessors": {},
              "frontier": [],
              "selected": [
                "A"
              ]
            },
            "highlights": []
          }
        },
        {
          "id": "3-relax-A-B",
          "caption": "Aを経由するとBへのコストが2になるので、距離と前の場所を更新します。",
          "canvas": {
            "data": {
              "mode": "dijkstra",
              "graph": {
                "nodes": [
                  {
                    "id": "A",
                    "x": 0,
                    "y": 0
                  },
                  {
                    "id": "B",
                    "x": 2,
                    "y": 0
                  },
                  {
                    "id": "C",
                    "x": 0,
                    "y": 1
                  },
                  {
                    "id": "D",
                    "x": 4,
                    "y": 0
                  },
                  {
                    "id": "E",
                    "x": 3,
                    "y": 1
                  },
                  {
                    "id": "F",
                    "x": 6,
                    "y": 0
                  }
                ],
                "edges": [
                  {
                    "from": "A",
                    "to": "B",
                    "weight": 2
                  },
                  {
                    "from": "A",
                    "to": "C",
                    "weight": 1
                  },
                  {
                    "from": "B",
                    "to": "D",
                    "weight": 2
                  },
                  {
                    "from": "B",
                    "to": "E",
                    "weight": 2
                  },
                  {
                    "from": "C",
                    "to": "E",
                    "weight": 5
                  },
                  {
                    "from": "D",
                    "to": "F",
                    "weight": 2
                  },
                  {
                    "from": "E",
                    "to": "F",
                    "weight": 5
                  }
                ]
              },
              "heuristic": null
            },
            "state": {
              "operation": "relax",
              "from": "A",
              "to": "B",
              "candidate": 2,
              "distances": {
                "A": 0,
                "B": 2,
                "C": null,
                "D": null,
                "E": null,
                "F": null
              },
              "predecessors": {
                "B": "A"
              },
              "frontier": [
                "B"
              ],
              "selected": [
                "A"
              ]
            },
            "highlights": [
              {
                "from": "A",
                "to": "B"
              }
            ]
          }
        },
        {
          "id": "4-relax-A-C",
          "caption": "Aを経由するとCへのコストが1になるので、距離と前の場所を更新します。",
          "canvas": {
            "data": {
              "mode": "dijkstra",
              "graph": {
                "nodes": [
                  {
                    "id": "A",
                    "x": 0,
                    "y": 0
                  },
                  {
                    "id": "B",
                    "x": 2,
                    "y": 0
                  },
                  {
                    "id": "C",
                    "x": 0,
                    "y": 1
                  },
                  {
                    "id": "D",
                    "x": 4,
                    "y": 0
                  },
                  {
                    "id": "E",
                    "x": 3,
                    "y": 1
                  },
                  {
                    "id": "F",
                    "x": 6,
                    "y": 0
                  }
                ],
                "edges": [
                  {
                    "from": "A",
                    "to": "B",
                    "weight": 2
                  },
                  {
                    "from": "A",
                    "to": "C",
                    "weight": 1
                  },
                  {
                    "from": "B",
                    "to": "D",
                    "weight": 2
                  },
                  {
                    "from": "B",
                    "to": "E",
                    "weight": 2
                  },
                  {
                    "from": "C",
                    "to": "E",
                    "weight": 5
                  },
                  {
                    "from": "D",
                    "to": "F",
                    "weight": 2
                  },
                  {
                    "from": "E",
                    "to": "F",
                    "weight": 5
                  }
                ]
              },
              "heuristic": null
            },
            "state": {
              "operation": "relax",
              "from": "A",
              "to": "C",
              "candidate": 1,
              "distances": {
                "A": 0,
                "B": 2,
                "C": 1,
                "D": null,
                "E": null,
                "F": null
              },
              "predecessors": {
                "B": "A",
                "C": "A"
              },
              "frontier": [
                "C",
                "B"
              ],
              "selected": [
                "A"
              ]
            },
            "highlights": [
              {
                "from": "A",
                "to": "C"
              }
            ]
          }
        },
        {
          "id": "5-select-C-none",
          "caption": "候補の中で移動コストが最小のC（1）を選びます。",
          "canvas": {
            "data": {
              "mode": "dijkstra",
              "graph": {
                "nodes": [
                  {
                    "id": "A",
                    "x": 0,
                    "y": 0
                  },
                  {
                    "id": "B",
                    "x": 2,
                    "y": 0
                  },
                  {
                    "id": "C",
                    "x": 0,
                    "y": 1
                  },
                  {
                    "id": "D",
                    "x": 4,
                    "y": 0
                  },
                  {
                    "id": "E",
                    "x": 3,
                    "y": 1
                  },
                  {
                    "id": "F",
                    "x": 6,
                    "y": 0
                  }
                ],
                "edges": [
                  {
                    "from": "A",
                    "to": "B",
                    "weight": 2
                  },
                  {
                    "from": "A",
                    "to": "C",
                    "weight": 1
                  },
                  {
                    "from": "B",
                    "to": "D",
                    "weight": 2
                  },
                  {
                    "from": "B",
                    "to": "E",
                    "weight": 2
                  },
                  {
                    "from": "C",
                    "to": "E",
                    "weight": 5
                  },
                  {
                    "from": "D",
                    "to": "F",
                    "weight": 2
                  },
                  {
                    "from": "E",
                    "to": "F",
                    "weight": 5
                  }
                ]
              },
              "heuristic": null
            },
            "state": {
              "operation": "select",
              "from": "C",
              "to": null,
              "candidate": null,
              "distances": {
                "A": 0,
                "B": 2,
                "C": 1,
                "D": null,
                "E": null,
                "F": null
              },
              "predecessors": {
                "B": "A",
                "C": "A"
              },
              "frontier": [
                "B"
              ],
              "selected": [
                "A",
                "C"
              ]
            },
            "highlights": []
          }
        },
        {
          "id": "6-keep-C-A",
          "caption": "Cを経由するとAへのコストは2となり、記録済みのコスト0より小さくないので更新しません。",
          "canvas": {
            "data": {
              "mode": "dijkstra",
              "graph": {
                "nodes": [
                  {
                    "id": "A",
                    "x": 0,
                    "y": 0
                  },
                  {
                    "id": "B",
                    "x": 2,
                    "y": 0
                  },
                  {
                    "id": "C",
                    "x": 0,
                    "y": 1
                  },
                  {
                    "id": "D",
                    "x": 4,
                    "y": 0
                  },
                  {
                    "id": "E",
                    "x": 3,
                    "y": 1
                  },
                  {
                    "id": "F",
                    "x": 6,
                    "y": 0
                  }
                ],
                "edges": [
                  {
                    "from": "A",
                    "to": "B",
                    "weight": 2
                  },
                  {
                    "from": "A",
                    "to": "C",
                    "weight": 1
                  },
                  {
                    "from": "B",
                    "to": "D",
                    "weight": 2
                  },
                  {
                    "from": "B",
                    "to": "E",
                    "weight": 2
                  },
                  {
                    "from": "C",
                    "to": "E",
                    "weight": 5
                  },
                  {
                    "from": "D",
                    "to": "F",
                    "weight": 2
                  },
                  {
                    "from": "E",
                    "to": "F",
                    "weight": 5
                  }
                ]
              },
              "heuristic": null
            },
            "state": {
              "operation": "keep",
              "from": "C",
              "to": "A",
              "candidate": 2,
              "distances": {
                "A": 0,
                "B": 2,
                "C": 1,
                "D": null,
                "E": null,
                "F": null
              },
              "predecessors": {
                "B": "A",
                "C": "A"
              },
              "frontier": [
                "B"
              ],
              "selected": [
                "A",
                "C"
              ]
            },
            "highlights": [
              {
                "from": "C",
                "to": "A"
              }
            ]
          }
        },
        {
          "id": "7-relax-C-E",
          "caption": "Cを経由するとEへのコストが6になるので、距離と前の場所を更新します。",
          "canvas": {
            "data": {
              "mode": "dijkstra",
              "graph": {
                "nodes": [
                  {
                    "id": "A",
                    "x": 0,
                    "y": 0
                  },
                  {
                    "id": "B",
                    "x": 2,
                    "y": 0
                  },
                  {
                    "id": "C",
                    "x": 0,
                    "y": 1
                  },
                  {
                    "id": "D",
                    "x": 4,
                    "y": 0
                  },
                  {
                    "id": "E",
                    "x": 3,
                    "y": 1
                  },
                  {
                    "id": "F",
                    "x": 6,
                    "y": 0
                  }
                ],
                "edges": [
                  {
                    "from": "A",
                    "to": "B",
                    "weight": 2
                  },
                  {
                    "from": "A",
                    "to": "C",
                    "weight": 1
                  },
                  {
                    "from": "B",
                    "to": "D",
                    "weight": 2
                  },
                  {
                    "from": "B",
                    "to": "E",
                    "weight": 2
                  },
                  {
                    "from": "C",
                    "to": "E",
                    "weight": 5
                  },
                  {
                    "from": "D",
                    "to": "F",
                    "weight": 2
                  },
                  {
                    "from": "E",
                    "to": "F",
                    "weight": 5
                  }
                ]
              },
              "heuristic": null
            },
            "state": {
              "operation": "relax",
              "from": "C",
              "to": "E",
              "candidate": 6,
              "distances": {
                "A": 0,
                "B": 2,
                "C": 1,
                "D": null,
                "E": 6,
                "F": null
              },
              "predecessors": {
                "B": "A",
                "C": "A",
                "E": "C"
              },
              "frontier": [
                "B",
                "E"
              ],
              "selected": [
                "A",
                "C"
              ]
            },
            "highlights": [
              {
                "from": "C",
                "to": "E"
              }
            ]
          }
        },
        {
          "id": "8-select-B-none",
          "caption": "候補の中で移動コストが最小のB（2）を選びます。",
          "canvas": {
            "data": {
              "mode": "dijkstra",
              "graph": {
                "nodes": [
                  {
                    "id": "A",
                    "x": 0,
                    "y": 0
                  },
                  {
                    "id": "B",
                    "x": 2,
                    "y": 0
                  },
                  {
                    "id": "C",
                    "x": 0,
                    "y": 1
                  },
                  {
                    "id": "D",
                    "x": 4,
                    "y": 0
                  },
                  {
                    "id": "E",
                    "x": 3,
                    "y": 1
                  },
                  {
                    "id": "F",
                    "x": 6,
                    "y": 0
                  }
                ],
                "edges": [
                  {
                    "from": "A",
                    "to": "B",
                    "weight": 2
                  },
                  {
                    "from": "A",
                    "to": "C",
                    "weight": 1
                  },
                  {
                    "from": "B",
                    "to": "D",
                    "weight": 2
                  },
                  {
                    "from": "B",
                    "to": "E",
                    "weight": 2
                  },
                  {
                    "from": "C",
                    "to": "E",
                    "weight": 5
                  },
                  {
                    "from": "D",
                    "to": "F",
                    "weight": 2
                  },
                  {
                    "from": "E",
                    "to": "F",
                    "weight": 5
                  }
                ]
              },
              "heuristic": null
            },
            "state": {
              "operation": "select",
              "from": "B",
              "to": null,
              "candidate": null,
              "distances": {
                "A": 0,
                "B": 2,
                "C": 1,
                "D": null,
                "E": 6,
                "F": null
              },
              "predecessors": {
                "B": "A",
                "C": "A",
                "E": "C"
              },
              "frontier": [
                "E"
              ],
              "selected": [
                "A",
                "C",
                "B"
              ]
            },
            "highlights": []
          }
        },
        {
          "id": "9-keep-B-A",
          "caption": "Bを経由するとAへのコストは4となり、記録済みのコスト0より小さくないので更新しません。",
          "canvas": {
            "data": {
              "mode": "dijkstra",
              "graph": {
                "nodes": [
                  {
                    "id": "A",
                    "x": 0,
                    "y": 0
                  },
                  {
                    "id": "B",
                    "x": 2,
                    "y": 0
                  },
                  {
                    "id": "C",
                    "x": 0,
                    "y": 1
                  },
                  {
                    "id": "D",
                    "x": 4,
                    "y": 0
                  },
                  {
                    "id": "E",
                    "x": 3,
                    "y": 1
                  },
                  {
                    "id": "F",
                    "x": 6,
                    "y": 0
                  }
                ],
                "edges": [
                  {
                    "from": "A",
                    "to": "B",
                    "weight": 2
                  },
                  {
                    "from": "A",
                    "to": "C",
                    "weight": 1
                  },
                  {
                    "from": "B",
                    "to": "D",
                    "weight": 2
                  },
                  {
                    "from": "B",
                    "to": "E",
                    "weight": 2
                  },
                  {
                    "from": "C",
                    "to": "E",
                    "weight": 5
                  },
                  {
                    "from": "D",
                    "to": "F",
                    "weight": 2
                  },
                  {
                    "from": "E",
                    "to": "F",
                    "weight": 5
                  }
                ]
              },
              "heuristic": null
            },
            "state": {
              "operation": "keep",
              "from": "B",
              "to": "A",
              "candidate": 4,
              "distances": {
                "A": 0,
                "B": 2,
                "C": 1,
                "D": null,
                "E": 6,
                "F": null
              },
              "predecessors": {
                "B": "A",
                "C": "A",
                "E": "C"
              },
              "frontier": [
                "E"
              ],
              "selected": [
                "A",
                "C",
                "B"
              ]
            },
            "highlights": [
              {
                "from": "B",
                "to": "A"
              }
            ]
          }
        },
        {
          "id": "10-relax-B-D",
          "caption": "Bを経由するとDへのコストが4になるので、距離と前の場所を更新します。",
          "canvas": {
            "data": {
              "mode": "dijkstra",
              "graph": {
                "nodes": [
                  {
                    "id": "A",
                    "x": 0,
                    "y": 0
                  },
                  {
                    "id": "B",
                    "x": 2,
                    "y": 0
                  },
                  {
                    "id": "C",
                    "x": 0,
                    "y": 1
                  },
                  {
                    "id": "D",
                    "x": 4,
                    "y": 0
                  },
                  {
                    "id": "E",
                    "x": 3,
                    "y": 1
                  },
                  {
                    "id": "F",
                    "x": 6,
                    "y": 0
                  }
                ],
                "edges": [
                  {
                    "from": "A",
                    "to": "B",
                    "weight": 2
                  },
                  {
                    "from": "A",
                    "to": "C",
                    "weight": 1
                  },
                  {
                    "from": "B",
                    "to": "D",
                    "weight": 2
                  },
                  {
                    "from": "B",
                    "to": "E",
                    "weight": 2
                  },
                  {
                    "from": "C",
                    "to": "E",
                    "weight": 5
                  },
                  {
                    "from": "D",
                    "to": "F",
                    "weight": 2
                  },
                  {
                    "from": "E",
                    "to": "F",
                    "weight": 5
                  }
                ]
              },
              "heuristic": null
            },
            "state": {
              "operation": "relax",
              "from": "B",
              "to": "D",
              "candidate": 4,
              "distances": {
                "A": 0,
                "B": 2,
                "C": 1,
                "D": 4,
                "E": 6,
                "F": null
              },
              "predecessors": {
                "B": "A",
                "C": "A",
                "E": "C",
                "D": "B"
              },
              "frontier": [
                "D",
                "E"
              ],
              "selected": [
                "A",
                "C",
                "B"
              ]
            },
            "highlights": [
              {
                "from": "B",
                "to": "D"
              }
            ]
          }
        },
        {
          "id": "11-relax-B-E",
          "caption": "Bを経由するとEへのコストが4になるので、距離と前の場所を更新します。",
          "canvas": {
            "data": {
              "mode": "dijkstra",
              "graph": {
                "nodes": [
                  {
                    "id": "A",
                    "x": 0,
                    "y": 0
                  },
                  {
                    "id": "B",
                    "x": 2,
                    "y": 0
                  },
                  {
                    "id": "C",
                    "x": 0,
                    "y": 1
                  },
                  {
                    "id": "D",
                    "x": 4,
                    "y": 0
                  },
                  {
                    "id": "E",
                    "x": 3,
                    "y": 1
                  },
                  {
                    "id": "F",
                    "x": 6,
                    "y": 0
                  }
                ],
                "edges": [
                  {
                    "from": "A",
                    "to": "B",
                    "weight": 2
                  },
                  {
                    "from": "A",
                    "to": "C",
                    "weight": 1
                  },
                  {
                    "from": "B",
                    "to": "D",
                    "weight": 2
                  },
                  {
                    "from": "B",
                    "to": "E",
                    "weight": 2
                  },
                  {
                    "from": "C",
                    "to": "E",
                    "weight": 5
                  },
                  {
                    "from": "D",
                    "to": "F",
                    "weight": 2
                  },
                  {
                    "from": "E",
                    "to": "F",
                    "weight": 5
                  }
                ]
              },
              "heuristic": null
            },
            "state": {
              "operation": "relax",
              "from": "B",
              "to": "E",
              "candidate": 4,
              "distances": {
                "A": 0,
                "B": 2,
                "C": 1,
                "D": 4,
                "E": 4,
                "F": null
              },
              "predecessors": {
                "B": "A",
                "C": "A",
                "E": "B",
                "D": "B"
              },
              "frontier": [
                "D",
                "E"
              ],
              "selected": [
                "A",
                "C",
                "B"
              ]
            },
            "highlights": [
              {
                "from": "B",
                "to": "E"
              }
            ]
          }
        },
        {
          "id": "12-select-D-none",
          "caption": "候補の中で移動コストが最小のD（4）を選びます。",
          "canvas": {
            "data": {
              "mode": "dijkstra",
              "graph": {
                "nodes": [
                  {
                    "id": "A",
                    "x": 0,
                    "y": 0
                  },
                  {
                    "id": "B",
                    "x": 2,
                    "y": 0
                  },
                  {
                    "id": "C",
                    "x": 0,
                    "y": 1
                  },
                  {
                    "id": "D",
                    "x": 4,
                    "y": 0
                  },
                  {
                    "id": "E",
                    "x": 3,
                    "y": 1
                  },
                  {
                    "id": "F",
                    "x": 6,
                    "y": 0
                  }
                ],
                "edges": [
                  {
                    "from": "A",
                    "to": "B",
                    "weight": 2
                  },
                  {
                    "from": "A",
                    "to": "C",
                    "weight": 1
                  },
                  {
                    "from": "B",
                    "to": "D",
                    "weight": 2
                  },
                  {
                    "from": "B",
                    "to": "E",
                    "weight": 2
                  },
                  {
                    "from": "C",
                    "to": "E",
                    "weight": 5
                  },
                  {
                    "from": "D",
                    "to": "F",
                    "weight": 2
                  },
                  {
                    "from": "E",
                    "to": "F",
                    "weight": 5
                  }
                ]
              },
              "heuristic": null
            },
            "state": {
              "operation": "select",
              "from": "D",
              "to": null,
              "candidate": null,
              "distances": {
                "A": 0,
                "B": 2,
                "C": 1,
                "D": 4,
                "E": 4,
                "F": null
              },
              "predecessors": {
                "B": "A",
                "C": "A",
                "E": "B",
                "D": "B"
              },
              "frontier": [
                "E"
              ],
              "selected": [
                "A",
                "C",
                "B",
                "D"
              ]
            },
            "highlights": []
          }
        },
        {
          "id": "13-keep-D-B",
          "caption": "Dを経由するとBへのコストは6となり、記録済みのコスト2より小さくないので更新しません。",
          "canvas": {
            "data": {
              "mode": "dijkstra",
              "graph": {
                "nodes": [
                  {
                    "id": "A",
                    "x": 0,
                    "y": 0
                  },
                  {
                    "id": "B",
                    "x": 2,
                    "y": 0
                  },
                  {
                    "id": "C",
                    "x": 0,
                    "y": 1
                  },
                  {
                    "id": "D",
                    "x": 4,
                    "y": 0
                  },
                  {
                    "id": "E",
                    "x": 3,
                    "y": 1
                  },
                  {
                    "id": "F",
                    "x": 6,
                    "y": 0
                  }
                ],
                "edges": [
                  {
                    "from": "A",
                    "to": "B",
                    "weight": 2
                  },
                  {
                    "from": "A",
                    "to": "C",
                    "weight": 1
                  },
                  {
                    "from": "B",
                    "to": "D",
                    "weight": 2
                  },
                  {
                    "from": "B",
                    "to": "E",
                    "weight": 2
                  },
                  {
                    "from": "C",
                    "to": "E",
                    "weight": 5
                  },
                  {
                    "from": "D",
                    "to": "F",
                    "weight": 2
                  },
                  {
                    "from": "E",
                    "to": "F",
                    "weight": 5
                  }
                ]
              },
              "heuristic": null
            },
            "state": {
              "operation": "keep",
              "from": "D",
              "to": "B",
              "candidate": 6,
              "distances": {
                "A": 0,
                "B": 2,
                "C": 1,
                "D": 4,
                "E": 4,
                "F": null
              },
              "predecessors": {
                "B": "A",
                "C": "A",
                "E": "B",
                "D": "B"
              },
              "frontier": [
                "E"
              ],
              "selected": [
                "A",
                "C",
                "B",
                "D"
              ]
            },
            "highlights": [
              {
                "from": "D",
                "to": "B"
              }
            ]
          }
        },
        {
          "id": "14-relax-D-F",
          "caption": "Dを経由するとFへのコストが6になるので、距離と前の場所を更新します。",
          "canvas": {
            "data": {
              "mode": "dijkstra",
              "graph": {
                "nodes": [
                  {
                    "id": "A",
                    "x": 0,
                    "y": 0
                  },
                  {
                    "id": "B",
                    "x": 2,
                    "y": 0
                  },
                  {
                    "id": "C",
                    "x": 0,
                    "y": 1
                  },
                  {
                    "id": "D",
                    "x": 4,
                    "y": 0
                  },
                  {
                    "id": "E",
                    "x": 3,
                    "y": 1
                  },
                  {
                    "id": "F",
                    "x": 6,
                    "y": 0
                  }
                ],
                "edges": [
                  {
                    "from": "A",
                    "to": "B",
                    "weight": 2
                  },
                  {
                    "from": "A",
                    "to": "C",
                    "weight": 1
                  },
                  {
                    "from": "B",
                    "to": "D",
                    "weight": 2
                  },
                  {
                    "from": "B",
                    "to": "E",
                    "weight": 2
                  },
                  {
                    "from": "C",
                    "to": "E",
                    "weight": 5
                  },
                  {
                    "from": "D",
                    "to": "F",
                    "weight": 2
                  },
                  {
                    "from": "E",
                    "to": "F",
                    "weight": 5
                  }
                ]
              },
              "heuristic": null
            },
            "state": {
              "operation": "relax",
              "from": "D",
              "to": "F",
              "candidate": 6,
              "distances": {
                "A": 0,
                "B": 2,
                "C": 1,
                "D": 4,
                "E": 4,
                "F": 6
              },
              "predecessors": {
                "B": "A",
                "C": "A",
                "E": "B",
                "D": "B",
                "F": "D"
              },
              "frontier": [
                "E",
                "F"
              ],
              "selected": [
                "A",
                "C",
                "B",
                "D"
              ]
            },
            "highlights": [
              {
                "from": "D",
                "to": "F"
              }
            ]
          }
        },
        {
          "id": "15-select-E-none",
          "caption": "候補の中で移動コストが最小のE（4）を選びます。",
          "canvas": {
            "data": {
              "mode": "dijkstra",
              "graph": {
                "nodes": [
                  {
                    "id": "A",
                    "x": 0,
                    "y": 0
                  },
                  {
                    "id": "B",
                    "x": 2,
                    "y": 0
                  },
                  {
                    "id": "C",
                    "x": 0,
                    "y": 1
                  },
                  {
                    "id": "D",
                    "x": 4,
                    "y": 0
                  },
                  {
                    "id": "E",
                    "x": 3,
                    "y": 1
                  },
                  {
                    "id": "F",
                    "x": 6,
                    "y": 0
                  }
                ],
                "edges": [
                  {
                    "from": "A",
                    "to": "B",
                    "weight": 2
                  },
                  {
                    "from": "A",
                    "to": "C",
                    "weight": 1
                  },
                  {
                    "from": "B",
                    "to": "D",
                    "weight": 2
                  },
                  {
                    "from": "B",
                    "to": "E",
                    "weight": 2
                  },
                  {
                    "from": "C",
                    "to": "E",
                    "weight": 5
                  },
                  {
                    "from": "D",
                    "to": "F",
                    "weight": 2
                  },
                  {
                    "from": "E",
                    "to": "F",
                    "weight": 5
                  }
                ]
              },
              "heuristic": null
            },
            "state": {
              "operation": "select",
              "from": "E",
              "to": null,
              "candidate": null,
              "distances": {
                "A": 0,
                "B": 2,
                "C": 1,
                "D": 4,
                "E": 4,
                "F": 6
              },
              "predecessors": {
                "B": "A",
                "C": "A",
                "E": "B",
                "D": "B",
                "F": "D"
              },
              "frontier": [
                "F"
              ],
              "selected": [
                "A",
                "C",
                "B",
                "D",
                "E"
              ]
            },
            "highlights": []
          }
        },
        {
          "id": "16-keep-E-B",
          "caption": "Eを経由するとBへのコストは6となり、記録済みのコスト2より小さくないので更新しません。",
          "canvas": {
            "data": {
              "mode": "dijkstra",
              "graph": {
                "nodes": [
                  {
                    "id": "A",
                    "x": 0,
                    "y": 0
                  },
                  {
                    "id": "B",
                    "x": 2,
                    "y": 0
                  },
                  {
                    "id": "C",
                    "x": 0,
                    "y": 1
                  },
                  {
                    "id": "D",
                    "x": 4,
                    "y": 0
                  },
                  {
                    "id": "E",
                    "x": 3,
                    "y": 1
                  },
                  {
                    "id": "F",
                    "x": 6,
                    "y": 0
                  }
                ],
                "edges": [
                  {
                    "from": "A",
                    "to": "B",
                    "weight": 2
                  },
                  {
                    "from": "A",
                    "to": "C",
                    "weight": 1
                  },
                  {
                    "from": "B",
                    "to": "D",
                    "weight": 2
                  },
                  {
                    "from": "B",
                    "to": "E",
                    "weight": 2
                  },
                  {
                    "from": "C",
                    "to": "E",
                    "weight": 5
                  },
                  {
                    "from": "D",
                    "to": "F",
                    "weight": 2
                  },
                  {
                    "from": "E",
                    "to": "F",
                    "weight": 5
                  }
                ]
              },
              "heuristic": null
            },
            "state": {
              "operation": "keep",
              "from": "E",
              "to": "B",
              "candidate": 6,
              "distances": {
                "A": 0,
                "B": 2,
                "C": 1,
                "D": 4,
                "E": 4,
                "F": 6
              },
              "predecessors": {
                "B": "A",
                "C": "A",
                "E": "B",
                "D": "B",
                "F": "D"
              },
              "frontier": [
                "F"
              ],
              "selected": [
                "A",
                "C",
                "B",
                "D",
                "E"
              ]
            },
            "highlights": [
              {
                "from": "E",
                "to": "B"
              }
            ]
          }
        },
        {
          "id": "17-keep-E-C",
          "caption": "Eを経由するとCへのコストは9となり、記録済みのコスト1より小さくないので更新しません。",
          "canvas": {
            "data": {
              "mode": "dijkstra",
              "graph": {
                "nodes": [
                  {
                    "id": "A",
                    "x": 0,
                    "y": 0
                  },
                  {
                    "id": "B",
                    "x": 2,
                    "y": 0
                  },
                  {
                    "id": "C",
                    "x": 0,
                    "y": 1
                  },
                  {
                    "id": "D",
                    "x": 4,
                    "y": 0
                  },
                  {
                    "id": "E",
                    "x": 3,
                    "y": 1
                  },
                  {
                    "id": "F",
                    "x": 6,
                    "y": 0
                  }
                ],
                "edges": [
                  {
                    "from": "A",
                    "to": "B",
                    "weight": 2
                  },
                  {
                    "from": "A",
                    "to": "C",
                    "weight": 1
                  },
                  {
                    "from": "B",
                    "to": "D",
                    "weight": 2
                  },
                  {
                    "from": "B",
                    "to": "E",
                    "weight": 2
                  },
                  {
                    "from": "C",
                    "to": "E",
                    "weight": 5
                  },
                  {
                    "from": "D",
                    "to": "F",
                    "weight": 2
                  },
                  {
                    "from": "E",
                    "to": "F",
                    "weight": 5
                  }
                ]
              },
              "heuristic": null
            },
            "state": {
              "operation": "keep",
              "from": "E",
              "to": "C",
              "candidate": 9,
              "distances": {
                "A": 0,
                "B": 2,
                "C": 1,
                "D": 4,
                "E": 4,
                "F": 6
              },
              "predecessors": {
                "B": "A",
                "C": "A",
                "E": "B",
                "D": "B",
                "F": "D"
              },
              "frontier": [
                "F"
              ],
              "selected": [
                "A",
                "C",
                "B",
                "D",
                "E"
              ]
            },
            "highlights": [
              {
                "from": "E",
                "to": "C"
              }
            ]
          }
        },
        {
          "id": "18-keep-E-F",
          "caption": "Eを経由するとFへのコストは9となり、記録済みのコスト6より小さくないので更新しません。",
          "canvas": {
            "data": {
              "mode": "dijkstra",
              "graph": {
                "nodes": [
                  {
                    "id": "A",
                    "x": 0,
                    "y": 0
                  },
                  {
                    "id": "B",
                    "x": 2,
                    "y": 0
                  },
                  {
                    "id": "C",
                    "x": 0,
                    "y": 1
                  },
                  {
                    "id": "D",
                    "x": 4,
                    "y": 0
                  },
                  {
                    "id": "E",
                    "x": 3,
                    "y": 1
                  },
                  {
                    "id": "F",
                    "x": 6,
                    "y": 0
                  }
                ],
                "edges": [
                  {
                    "from": "A",
                    "to": "B",
                    "weight": 2
                  },
                  {
                    "from": "A",
                    "to": "C",
                    "weight": 1
                  },
                  {
                    "from": "B",
                    "to": "D",
                    "weight": 2
                  },
                  {
                    "from": "B",
                    "to": "E",
                    "weight": 2
                  },
                  {
                    "from": "C",
                    "to": "E",
                    "weight": 5
                  },
                  {
                    "from": "D",
                    "to": "F",
                    "weight": 2
                  },
                  {
                    "from": "E",
                    "to": "F",
                    "weight": 5
                  }
                ]
              },
              "heuristic": null
            },
            "state": {
              "operation": "keep",
              "from": "E",
              "to": "F",
              "candidate": 9,
              "distances": {
                "A": 0,
                "B": 2,
                "C": 1,
                "D": 4,
                "E": 4,
                "F": 6
              },
              "predecessors": {
                "B": "A",
                "C": "A",
                "E": "B",
                "D": "B",
                "F": "D"
              },
              "frontier": [
                "F"
              ],
              "selected": [
                "A",
                "C",
                "B",
                "D",
                "E"
              ]
            },
            "highlights": [
              {
                "from": "E",
                "to": "F"
              }
            ]
          }
        },
        {
          "id": "19-select-F-none",
          "caption": "候補の中で移動コストが最小のF（6）を選びます。",
          "canvas": {
            "data": {
              "mode": "dijkstra",
              "graph": {
                "nodes": [
                  {
                    "id": "A",
                    "x": 0,
                    "y": 0
                  },
                  {
                    "id": "B",
                    "x": 2,
                    "y": 0
                  },
                  {
                    "id": "C",
                    "x": 0,
                    "y": 1
                  },
                  {
                    "id": "D",
                    "x": 4,
                    "y": 0
                  },
                  {
                    "id": "E",
                    "x": 3,
                    "y": 1
                  },
                  {
                    "id": "F",
                    "x": 6,
                    "y": 0
                  }
                ],
                "edges": [
                  {
                    "from": "A",
                    "to": "B",
                    "weight": 2
                  },
                  {
                    "from": "A",
                    "to": "C",
                    "weight": 1
                  },
                  {
                    "from": "B",
                    "to": "D",
                    "weight": 2
                  },
                  {
                    "from": "B",
                    "to": "E",
                    "weight": 2
                  },
                  {
                    "from": "C",
                    "to": "E",
                    "weight": 5
                  },
                  {
                    "from": "D",
                    "to": "F",
                    "weight": 2
                  },
                  {
                    "from": "E",
                    "to": "F",
                    "weight": 5
                  }
                ]
              },
              "heuristic": null
            },
            "state": {
              "operation": "select",
              "from": "F",
              "to": null,
              "candidate": null,
              "distances": {
                "A": 0,
                "B": 2,
                "C": 1,
                "D": 4,
                "E": 4,
                "F": 6
              },
              "predecessors": {
                "B": "A",
                "C": "A",
                "E": "B",
                "D": "B",
                "F": "D"
              },
              "frontier": [],
              "selected": [
                "A",
                "C",
                "B",
                "D",
                "E",
                "F"
              ]
            },
            "highlights": []
          }
        },
        {
          "id": "20-finish-F-none",
          "caption": "ゴールFから前の場所をたどると、最短経路A→B→D→F（コスト6）が分かります。",
          "canvas": {
            "data": {
              "mode": "dijkstra",
              "graph": {
                "nodes": [
                  {
                    "id": "A",
                    "x": 0,
                    "y": 0
                  },
                  {
                    "id": "B",
                    "x": 2,
                    "y": 0
                  },
                  {
                    "id": "C",
                    "x": 0,
                    "y": 1
                  },
                  {
                    "id": "D",
                    "x": 4,
                    "y": 0
                  },
                  {
                    "id": "E",
                    "x": 3,
                    "y": 1
                  },
                  {
                    "id": "F",
                    "x": 6,
                    "y": 0
                  }
                ],
                "edges": [
                  {
                    "from": "A",
                    "to": "B",
                    "weight": 2
                  },
                  {
                    "from": "A",
                    "to": "C",
                    "weight": 1
                  },
                  {
                    "from": "B",
                    "to": "D",
                    "weight": 2
                  },
                  {
                    "from": "B",
                    "to": "E",
                    "weight": 2
                  },
                  {
                    "from": "C",
                    "to": "E",
                    "weight": 5
                  },
                  {
                    "from": "D",
                    "to": "F",
                    "weight": 2
                  },
                  {
                    "from": "E",
                    "to": "F",
                    "weight": 5
                  }
                ]
              },
              "heuristic": null
            },
            "state": {
              "operation": "finish",
              "from": "F",
              "to": null,
              "candidate": null,
              "distances": {
                "A": 0,
                "B": 2,
                "C": 1,
                "D": 4,
                "E": 4,
                "F": 6
              },
              "predecessors": {
                "B": "A",
                "C": "A",
                "E": "B",
                "D": "B",
                "F": "D"
              },
              "frontier": [],
              "selected": [
                "A",
                "C",
                "B",
                "D",
                "E",
                "F"
              ]
            },
            "highlights": []
          }
        }
      ]
    },
    "mapping": {
      "version": 1,
      "kind": "step-sequence",
      "id": "dijkstra-code-mapping",
      "phase": 4,
      "intervalMs": 3500,
      "code": {
        "id": "dijkstra-v1",
        "version": 1,
        "language": "python",
        "lines": [
          {
            "id": "define-function",
            "text": "def dijkstra(graph, start, goal):"
          },
          {
            "id": "init-distance",
            "text": "    g = {start: 0}"
          },
          {
            "id": "init-parent",
            "text": "    parent = {}"
          },
          {
            "id": "init-frontier",
            "text": "    frontier = {start}"
          },
          {
            "id": "while-frontier",
            "text": "    while frontier:"
          },
          {
            "id": "select-min",
            "text": "        u = min(frontier, key=lambda n: (g[n], n))"
          },
          {
            "id": "remove",
            "text": "        frontier.remove(u)"
          },
          {
            "id": "goal-check",
            "text": "        if u == goal:"
          },
          {
            "id": "path-start",
            "text": "            path = [u]"
          },
          {
            "id": "path-loop",
            "text": "            while path[0] != start:"
          },
          {
            "id": "reconstruct",
            "text": "                path.insert(0, parent[path[0]])"
          },
          {
            "id": "return-path",
            "text": "            return (g[u], path)"
          },
          {
            "id": "for-neighbor",
            "text": "        for v, w in graph[u]:"
          },
          {
            "id": "candidate",
            "text": "            candidate = g[u] + w"
          },
          {
            "id": "relax-condition",
            "text": "            if candidate < g.get(v, float('inf')):"
          },
          {
            "id": "update-distance",
            "text": "                g[v] = candidate"
          },
          {
            "id": "update-parent",
            "text": "                parent[v] = u"
          },
          {
            "id": "add-frontier",
            "text": "                frontier.add(v)"
          },
          {
            "id": "unreachable",
            "text": "    return (None, [])"
          }
        ]
      },
      "steps": [
        {
          "id": "1-init-start-none",
          "caption": "出発点Aまでの移動コストを0として、候補に追加します。",
          "canvas": {
            "data": {
              "mode": "dijkstra",
              "graph": {
                "nodes": [
                  {
                    "id": "A",
                    "x": 0,
                    "y": 0
                  },
                  {
                    "id": "B",
                    "x": 2,
                    "y": 0
                  },
                  {
                    "id": "C",
                    "x": 0,
                    "y": 1
                  },
                  {
                    "id": "D",
                    "x": 4,
                    "y": 0
                  },
                  {
                    "id": "E",
                    "x": 3,
                    "y": 1
                  },
                  {
                    "id": "F",
                    "x": 6,
                    "y": 0
                  }
                ],
                "edges": [
                  {
                    "from": "A",
                    "to": "B",
                    "weight": 2
                  },
                  {
                    "from": "A",
                    "to": "C",
                    "weight": 1
                  },
                  {
                    "from": "B",
                    "to": "D",
                    "weight": 2
                  },
                  {
                    "from": "B",
                    "to": "E",
                    "weight": 2
                  },
                  {
                    "from": "C",
                    "to": "E",
                    "weight": 5
                  },
                  {
                    "from": "D",
                    "to": "F",
                    "weight": 2
                  },
                  {
                    "from": "E",
                    "to": "F",
                    "weight": 5
                  }
                ]
              },
              "heuristic": null
            },
            "state": {
              "operation": "init",
              "from": null,
              "to": null,
              "candidate": null,
              "distances": {
                "A": 0,
                "B": null,
                "C": null,
                "D": null,
                "E": null,
                "F": null
              },
              "predecessors": {},
              "frontier": [
                "A"
              ],
              "selected": []
            },
            "highlights": []
          },
          "codeFocus": [
            "init-distance",
            "init-parent",
            "init-frontier"
          ]
        },
        {
          "id": "2-select-A-none",
          "caption": "候補の中で移動コストが最小のA（0）を選びます。",
          "canvas": {
            "data": {
              "mode": "dijkstra",
              "graph": {
                "nodes": [
                  {
                    "id": "A",
                    "x": 0,
                    "y": 0
                  },
                  {
                    "id": "B",
                    "x": 2,
                    "y": 0
                  },
                  {
                    "id": "C",
                    "x": 0,
                    "y": 1
                  },
                  {
                    "id": "D",
                    "x": 4,
                    "y": 0
                  },
                  {
                    "id": "E",
                    "x": 3,
                    "y": 1
                  },
                  {
                    "id": "F",
                    "x": 6,
                    "y": 0
                  }
                ],
                "edges": [
                  {
                    "from": "A",
                    "to": "B",
                    "weight": 2
                  },
                  {
                    "from": "A",
                    "to": "C",
                    "weight": 1
                  },
                  {
                    "from": "B",
                    "to": "D",
                    "weight": 2
                  },
                  {
                    "from": "B",
                    "to": "E",
                    "weight": 2
                  },
                  {
                    "from": "C",
                    "to": "E",
                    "weight": 5
                  },
                  {
                    "from": "D",
                    "to": "F",
                    "weight": 2
                  },
                  {
                    "from": "E",
                    "to": "F",
                    "weight": 5
                  }
                ]
              },
              "heuristic": null
            },
            "state": {
              "operation": "select",
              "from": "A",
              "to": null,
              "candidate": null,
              "distances": {
                "A": 0,
                "B": null,
                "C": null,
                "D": null,
                "E": null,
                "F": null
              },
              "predecessors": {},
              "frontier": [],
              "selected": [
                "A"
              ]
            },
            "highlights": []
          },
          "codeFocus": [
            "while-frontier",
            "select-min",
            "remove"
          ]
        },
        {
          "id": "3-relax-A-B",
          "caption": "Aを経由するとBへのコストが2になるので、距離と前の場所を更新します。",
          "canvas": {
            "data": {
              "mode": "dijkstra",
              "graph": {
                "nodes": [
                  {
                    "id": "A",
                    "x": 0,
                    "y": 0
                  },
                  {
                    "id": "B",
                    "x": 2,
                    "y": 0
                  },
                  {
                    "id": "C",
                    "x": 0,
                    "y": 1
                  },
                  {
                    "id": "D",
                    "x": 4,
                    "y": 0
                  },
                  {
                    "id": "E",
                    "x": 3,
                    "y": 1
                  },
                  {
                    "id": "F",
                    "x": 6,
                    "y": 0
                  }
                ],
                "edges": [
                  {
                    "from": "A",
                    "to": "B",
                    "weight": 2
                  },
                  {
                    "from": "A",
                    "to": "C",
                    "weight": 1
                  },
                  {
                    "from": "B",
                    "to": "D",
                    "weight": 2
                  },
                  {
                    "from": "B",
                    "to": "E",
                    "weight": 2
                  },
                  {
                    "from": "C",
                    "to": "E",
                    "weight": 5
                  },
                  {
                    "from": "D",
                    "to": "F",
                    "weight": 2
                  },
                  {
                    "from": "E",
                    "to": "F",
                    "weight": 5
                  }
                ]
              },
              "heuristic": null
            },
            "state": {
              "operation": "relax",
              "from": "A",
              "to": "B",
              "candidate": 2,
              "distances": {
                "A": 0,
                "B": 2,
                "C": null,
                "D": null,
                "E": null,
                "F": null
              },
              "predecessors": {
                "B": "A"
              },
              "frontier": [
                "B"
              ],
              "selected": [
                "A"
              ]
            },
            "highlights": [
              {
                "from": "A",
                "to": "B"
              }
            ]
          },
          "codeFocus": [
            "for-neighbor",
            "candidate",
            "relax-condition",
            "update-distance",
            "update-parent",
            "add-frontier"
          ]
        },
        {
          "id": "4-relax-A-C",
          "caption": "Aを経由するとCへのコストが1になるので、距離と前の場所を更新します。",
          "canvas": {
            "data": {
              "mode": "dijkstra",
              "graph": {
                "nodes": [
                  {
                    "id": "A",
                    "x": 0,
                    "y": 0
                  },
                  {
                    "id": "B",
                    "x": 2,
                    "y": 0
                  },
                  {
                    "id": "C",
                    "x": 0,
                    "y": 1
                  },
                  {
                    "id": "D",
                    "x": 4,
                    "y": 0
                  },
                  {
                    "id": "E",
                    "x": 3,
                    "y": 1
                  },
                  {
                    "id": "F",
                    "x": 6,
                    "y": 0
                  }
                ],
                "edges": [
                  {
                    "from": "A",
                    "to": "B",
                    "weight": 2
                  },
                  {
                    "from": "A",
                    "to": "C",
                    "weight": 1
                  },
                  {
                    "from": "B",
                    "to": "D",
                    "weight": 2
                  },
                  {
                    "from": "B",
                    "to": "E",
                    "weight": 2
                  },
                  {
                    "from": "C",
                    "to": "E",
                    "weight": 5
                  },
                  {
                    "from": "D",
                    "to": "F",
                    "weight": 2
                  },
                  {
                    "from": "E",
                    "to": "F",
                    "weight": 5
                  }
                ]
              },
              "heuristic": null
            },
            "state": {
              "operation": "relax",
              "from": "A",
              "to": "C",
              "candidate": 1,
              "distances": {
                "A": 0,
                "B": 2,
                "C": 1,
                "D": null,
                "E": null,
                "F": null
              },
              "predecessors": {
                "B": "A",
                "C": "A"
              },
              "frontier": [
                "C",
                "B"
              ],
              "selected": [
                "A"
              ]
            },
            "highlights": [
              {
                "from": "A",
                "to": "C"
              }
            ]
          },
          "codeFocus": [
            "for-neighbor",
            "candidate",
            "relax-condition",
            "update-distance",
            "update-parent",
            "add-frontier"
          ]
        },
        {
          "id": "5-select-C-none",
          "caption": "候補の中で移動コストが最小のC（1）を選びます。",
          "canvas": {
            "data": {
              "mode": "dijkstra",
              "graph": {
                "nodes": [
                  {
                    "id": "A",
                    "x": 0,
                    "y": 0
                  },
                  {
                    "id": "B",
                    "x": 2,
                    "y": 0
                  },
                  {
                    "id": "C",
                    "x": 0,
                    "y": 1
                  },
                  {
                    "id": "D",
                    "x": 4,
                    "y": 0
                  },
                  {
                    "id": "E",
                    "x": 3,
                    "y": 1
                  },
                  {
                    "id": "F",
                    "x": 6,
                    "y": 0
                  }
                ],
                "edges": [
                  {
                    "from": "A",
                    "to": "B",
                    "weight": 2
                  },
                  {
                    "from": "A",
                    "to": "C",
                    "weight": 1
                  },
                  {
                    "from": "B",
                    "to": "D",
                    "weight": 2
                  },
                  {
                    "from": "B",
                    "to": "E",
                    "weight": 2
                  },
                  {
                    "from": "C",
                    "to": "E",
                    "weight": 5
                  },
                  {
                    "from": "D",
                    "to": "F",
                    "weight": 2
                  },
                  {
                    "from": "E",
                    "to": "F",
                    "weight": 5
                  }
                ]
              },
              "heuristic": null
            },
            "state": {
              "operation": "select",
              "from": "C",
              "to": null,
              "candidate": null,
              "distances": {
                "A": 0,
                "B": 2,
                "C": 1,
                "D": null,
                "E": null,
                "F": null
              },
              "predecessors": {
                "B": "A",
                "C": "A"
              },
              "frontier": [
                "B"
              ],
              "selected": [
                "A",
                "C"
              ]
            },
            "highlights": []
          },
          "codeFocus": [
            "while-frontier",
            "select-min",
            "remove"
          ]
        },
        {
          "id": "6-keep-C-A",
          "caption": "Cを経由するとAへのコストは2となり、記録済みのコスト0より小さくないので更新しません。",
          "canvas": {
            "data": {
              "mode": "dijkstra",
              "graph": {
                "nodes": [
                  {
                    "id": "A",
                    "x": 0,
                    "y": 0
                  },
                  {
                    "id": "B",
                    "x": 2,
                    "y": 0
                  },
                  {
                    "id": "C",
                    "x": 0,
                    "y": 1
                  },
                  {
                    "id": "D",
                    "x": 4,
                    "y": 0
                  },
                  {
                    "id": "E",
                    "x": 3,
                    "y": 1
                  },
                  {
                    "id": "F",
                    "x": 6,
                    "y": 0
                  }
                ],
                "edges": [
                  {
                    "from": "A",
                    "to": "B",
                    "weight": 2
                  },
                  {
                    "from": "A",
                    "to": "C",
                    "weight": 1
                  },
                  {
                    "from": "B",
                    "to": "D",
                    "weight": 2
                  },
                  {
                    "from": "B",
                    "to": "E",
                    "weight": 2
                  },
                  {
                    "from": "C",
                    "to": "E",
                    "weight": 5
                  },
                  {
                    "from": "D",
                    "to": "F",
                    "weight": 2
                  },
                  {
                    "from": "E",
                    "to": "F",
                    "weight": 5
                  }
                ]
              },
              "heuristic": null
            },
            "state": {
              "operation": "keep",
              "from": "C",
              "to": "A",
              "candidate": 2,
              "distances": {
                "A": 0,
                "B": 2,
                "C": 1,
                "D": null,
                "E": null,
                "F": null
              },
              "predecessors": {
                "B": "A",
                "C": "A"
              },
              "frontier": [
                "B"
              ],
              "selected": [
                "A",
                "C"
              ]
            },
            "highlights": [
              {
                "from": "C",
                "to": "A"
              }
            ]
          },
          "codeFocus": [
            "for-neighbor",
            "candidate",
            "relax-condition"
          ]
        },
        {
          "id": "7-relax-C-E",
          "caption": "Cを経由するとEへのコストが6になるので、距離と前の場所を更新します。",
          "canvas": {
            "data": {
              "mode": "dijkstra",
              "graph": {
                "nodes": [
                  {
                    "id": "A",
                    "x": 0,
                    "y": 0
                  },
                  {
                    "id": "B",
                    "x": 2,
                    "y": 0
                  },
                  {
                    "id": "C",
                    "x": 0,
                    "y": 1
                  },
                  {
                    "id": "D",
                    "x": 4,
                    "y": 0
                  },
                  {
                    "id": "E",
                    "x": 3,
                    "y": 1
                  },
                  {
                    "id": "F",
                    "x": 6,
                    "y": 0
                  }
                ],
                "edges": [
                  {
                    "from": "A",
                    "to": "B",
                    "weight": 2
                  },
                  {
                    "from": "A",
                    "to": "C",
                    "weight": 1
                  },
                  {
                    "from": "B",
                    "to": "D",
                    "weight": 2
                  },
                  {
                    "from": "B",
                    "to": "E",
                    "weight": 2
                  },
                  {
                    "from": "C",
                    "to": "E",
                    "weight": 5
                  },
                  {
                    "from": "D",
                    "to": "F",
                    "weight": 2
                  },
                  {
                    "from": "E",
                    "to": "F",
                    "weight": 5
                  }
                ]
              },
              "heuristic": null
            },
            "state": {
              "operation": "relax",
              "from": "C",
              "to": "E",
              "candidate": 6,
              "distances": {
                "A": 0,
                "B": 2,
                "C": 1,
                "D": null,
                "E": 6,
                "F": null
              },
              "predecessors": {
                "B": "A",
                "C": "A",
                "E": "C"
              },
              "frontier": [
                "B",
                "E"
              ],
              "selected": [
                "A",
                "C"
              ]
            },
            "highlights": [
              {
                "from": "C",
                "to": "E"
              }
            ]
          },
          "codeFocus": [
            "for-neighbor",
            "candidate",
            "relax-condition",
            "update-distance",
            "update-parent",
            "add-frontier"
          ]
        },
        {
          "id": "8-select-B-none",
          "caption": "候補の中で移動コストが最小のB（2）を選びます。",
          "canvas": {
            "data": {
              "mode": "dijkstra",
              "graph": {
                "nodes": [
                  {
                    "id": "A",
                    "x": 0,
                    "y": 0
                  },
                  {
                    "id": "B",
                    "x": 2,
                    "y": 0
                  },
                  {
                    "id": "C",
                    "x": 0,
                    "y": 1
                  },
                  {
                    "id": "D",
                    "x": 4,
                    "y": 0
                  },
                  {
                    "id": "E",
                    "x": 3,
                    "y": 1
                  },
                  {
                    "id": "F",
                    "x": 6,
                    "y": 0
                  }
                ],
                "edges": [
                  {
                    "from": "A",
                    "to": "B",
                    "weight": 2
                  },
                  {
                    "from": "A",
                    "to": "C",
                    "weight": 1
                  },
                  {
                    "from": "B",
                    "to": "D",
                    "weight": 2
                  },
                  {
                    "from": "B",
                    "to": "E",
                    "weight": 2
                  },
                  {
                    "from": "C",
                    "to": "E",
                    "weight": 5
                  },
                  {
                    "from": "D",
                    "to": "F",
                    "weight": 2
                  },
                  {
                    "from": "E",
                    "to": "F",
                    "weight": 5
                  }
                ]
              },
              "heuristic": null
            },
            "state": {
              "operation": "select",
              "from": "B",
              "to": null,
              "candidate": null,
              "distances": {
                "A": 0,
                "B": 2,
                "C": 1,
                "D": null,
                "E": 6,
                "F": null
              },
              "predecessors": {
                "B": "A",
                "C": "A",
                "E": "C"
              },
              "frontier": [
                "E"
              ],
              "selected": [
                "A",
                "C",
                "B"
              ]
            },
            "highlights": []
          },
          "codeFocus": [
            "while-frontier",
            "select-min",
            "remove"
          ]
        },
        {
          "id": "9-keep-B-A",
          "caption": "Bを経由するとAへのコストは4となり、記録済みのコスト0より小さくないので更新しません。",
          "canvas": {
            "data": {
              "mode": "dijkstra",
              "graph": {
                "nodes": [
                  {
                    "id": "A",
                    "x": 0,
                    "y": 0
                  },
                  {
                    "id": "B",
                    "x": 2,
                    "y": 0
                  },
                  {
                    "id": "C",
                    "x": 0,
                    "y": 1
                  },
                  {
                    "id": "D",
                    "x": 4,
                    "y": 0
                  },
                  {
                    "id": "E",
                    "x": 3,
                    "y": 1
                  },
                  {
                    "id": "F",
                    "x": 6,
                    "y": 0
                  }
                ],
                "edges": [
                  {
                    "from": "A",
                    "to": "B",
                    "weight": 2
                  },
                  {
                    "from": "A",
                    "to": "C",
                    "weight": 1
                  },
                  {
                    "from": "B",
                    "to": "D",
                    "weight": 2
                  },
                  {
                    "from": "B",
                    "to": "E",
                    "weight": 2
                  },
                  {
                    "from": "C",
                    "to": "E",
                    "weight": 5
                  },
                  {
                    "from": "D",
                    "to": "F",
                    "weight": 2
                  },
                  {
                    "from": "E",
                    "to": "F",
                    "weight": 5
                  }
                ]
              },
              "heuristic": null
            },
            "state": {
              "operation": "keep",
              "from": "B",
              "to": "A",
              "candidate": 4,
              "distances": {
                "A": 0,
                "B": 2,
                "C": 1,
                "D": null,
                "E": 6,
                "F": null
              },
              "predecessors": {
                "B": "A",
                "C": "A",
                "E": "C"
              },
              "frontier": [
                "E"
              ],
              "selected": [
                "A",
                "C",
                "B"
              ]
            },
            "highlights": [
              {
                "from": "B",
                "to": "A"
              }
            ]
          },
          "codeFocus": [
            "for-neighbor",
            "candidate",
            "relax-condition"
          ]
        },
        {
          "id": "10-relax-B-D",
          "caption": "Bを経由するとDへのコストが4になるので、距離と前の場所を更新します。",
          "canvas": {
            "data": {
              "mode": "dijkstra",
              "graph": {
                "nodes": [
                  {
                    "id": "A",
                    "x": 0,
                    "y": 0
                  },
                  {
                    "id": "B",
                    "x": 2,
                    "y": 0
                  },
                  {
                    "id": "C",
                    "x": 0,
                    "y": 1
                  },
                  {
                    "id": "D",
                    "x": 4,
                    "y": 0
                  },
                  {
                    "id": "E",
                    "x": 3,
                    "y": 1
                  },
                  {
                    "id": "F",
                    "x": 6,
                    "y": 0
                  }
                ],
                "edges": [
                  {
                    "from": "A",
                    "to": "B",
                    "weight": 2
                  },
                  {
                    "from": "A",
                    "to": "C",
                    "weight": 1
                  },
                  {
                    "from": "B",
                    "to": "D",
                    "weight": 2
                  },
                  {
                    "from": "B",
                    "to": "E",
                    "weight": 2
                  },
                  {
                    "from": "C",
                    "to": "E",
                    "weight": 5
                  },
                  {
                    "from": "D",
                    "to": "F",
                    "weight": 2
                  },
                  {
                    "from": "E",
                    "to": "F",
                    "weight": 5
                  }
                ]
              },
              "heuristic": null
            },
            "state": {
              "operation": "relax",
              "from": "B",
              "to": "D",
              "candidate": 4,
              "distances": {
                "A": 0,
                "B": 2,
                "C": 1,
                "D": 4,
                "E": 6,
                "F": null
              },
              "predecessors": {
                "B": "A",
                "C": "A",
                "E": "C",
                "D": "B"
              },
              "frontier": [
                "D",
                "E"
              ],
              "selected": [
                "A",
                "C",
                "B"
              ]
            },
            "highlights": [
              {
                "from": "B",
                "to": "D"
              }
            ]
          },
          "codeFocus": [
            "for-neighbor",
            "candidate",
            "relax-condition",
            "update-distance",
            "update-parent",
            "add-frontier"
          ]
        },
        {
          "id": "11-relax-B-E",
          "caption": "Bを経由するとEへのコストが4になるので、距離と前の場所を更新します。",
          "canvas": {
            "data": {
              "mode": "dijkstra",
              "graph": {
                "nodes": [
                  {
                    "id": "A",
                    "x": 0,
                    "y": 0
                  },
                  {
                    "id": "B",
                    "x": 2,
                    "y": 0
                  },
                  {
                    "id": "C",
                    "x": 0,
                    "y": 1
                  },
                  {
                    "id": "D",
                    "x": 4,
                    "y": 0
                  },
                  {
                    "id": "E",
                    "x": 3,
                    "y": 1
                  },
                  {
                    "id": "F",
                    "x": 6,
                    "y": 0
                  }
                ],
                "edges": [
                  {
                    "from": "A",
                    "to": "B",
                    "weight": 2
                  },
                  {
                    "from": "A",
                    "to": "C",
                    "weight": 1
                  },
                  {
                    "from": "B",
                    "to": "D",
                    "weight": 2
                  },
                  {
                    "from": "B",
                    "to": "E",
                    "weight": 2
                  },
                  {
                    "from": "C",
                    "to": "E",
                    "weight": 5
                  },
                  {
                    "from": "D",
                    "to": "F",
                    "weight": 2
                  },
                  {
                    "from": "E",
                    "to": "F",
                    "weight": 5
                  }
                ]
              },
              "heuristic": null
            },
            "state": {
              "operation": "relax",
              "from": "B",
              "to": "E",
              "candidate": 4,
              "distances": {
                "A": 0,
                "B": 2,
                "C": 1,
                "D": 4,
                "E": 4,
                "F": null
              },
              "predecessors": {
                "B": "A",
                "C": "A",
                "E": "B",
                "D": "B"
              },
              "frontier": [
                "D",
                "E"
              ],
              "selected": [
                "A",
                "C",
                "B"
              ]
            },
            "highlights": [
              {
                "from": "B",
                "to": "E"
              }
            ]
          },
          "codeFocus": [
            "for-neighbor",
            "candidate",
            "relax-condition",
            "update-distance",
            "update-parent",
            "add-frontier"
          ]
        },
        {
          "id": "12-select-D-none",
          "caption": "候補の中で移動コストが最小のD（4）を選びます。",
          "canvas": {
            "data": {
              "mode": "dijkstra",
              "graph": {
                "nodes": [
                  {
                    "id": "A",
                    "x": 0,
                    "y": 0
                  },
                  {
                    "id": "B",
                    "x": 2,
                    "y": 0
                  },
                  {
                    "id": "C",
                    "x": 0,
                    "y": 1
                  },
                  {
                    "id": "D",
                    "x": 4,
                    "y": 0
                  },
                  {
                    "id": "E",
                    "x": 3,
                    "y": 1
                  },
                  {
                    "id": "F",
                    "x": 6,
                    "y": 0
                  }
                ],
                "edges": [
                  {
                    "from": "A",
                    "to": "B",
                    "weight": 2
                  },
                  {
                    "from": "A",
                    "to": "C",
                    "weight": 1
                  },
                  {
                    "from": "B",
                    "to": "D",
                    "weight": 2
                  },
                  {
                    "from": "B",
                    "to": "E",
                    "weight": 2
                  },
                  {
                    "from": "C",
                    "to": "E",
                    "weight": 5
                  },
                  {
                    "from": "D",
                    "to": "F",
                    "weight": 2
                  },
                  {
                    "from": "E",
                    "to": "F",
                    "weight": 5
                  }
                ]
              },
              "heuristic": null
            },
            "state": {
              "operation": "select",
              "from": "D",
              "to": null,
              "candidate": null,
              "distances": {
                "A": 0,
                "B": 2,
                "C": 1,
                "D": 4,
                "E": 4,
                "F": null
              },
              "predecessors": {
                "B": "A",
                "C": "A",
                "E": "B",
                "D": "B"
              },
              "frontier": [
                "E"
              ],
              "selected": [
                "A",
                "C",
                "B",
                "D"
              ]
            },
            "highlights": []
          },
          "codeFocus": [
            "while-frontier",
            "select-min",
            "remove"
          ]
        },
        {
          "id": "13-keep-D-B",
          "caption": "Dを経由するとBへのコストは6となり、記録済みのコスト2より小さくないので更新しません。",
          "canvas": {
            "data": {
              "mode": "dijkstra",
              "graph": {
                "nodes": [
                  {
                    "id": "A",
                    "x": 0,
                    "y": 0
                  },
                  {
                    "id": "B",
                    "x": 2,
                    "y": 0
                  },
                  {
                    "id": "C",
                    "x": 0,
                    "y": 1
                  },
                  {
                    "id": "D",
                    "x": 4,
                    "y": 0
                  },
                  {
                    "id": "E",
                    "x": 3,
                    "y": 1
                  },
                  {
                    "id": "F",
                    "x": 6,
                    "y": 0
                  }
                ],
                "edges": [
                  {
                    "from": "A",
                    "to": "B",
                    "weight": 2
                  },
                  {
                    "from": "A",
                    "to": "C",
                    "weight": 1
                  },
                  {
                    "from": "B",
                    "to": "D",
                    "weight": 2
                  },
                  {
                    "from": "B",
                    "to": "E",
                    "weight": 2
                  },
                  {
                    "from": "C",
                    "to": "E",
                    "weight": 5
                  },
                  {
                    "from": "D",
                    "to": "F",
                    "weight": 2
                  },
                  {
                    "from": "E",
                    "to": "F",
                    "weight": 5
                  }
                ]
              },
              "heuristic": null
            },
            "state": {
              "operation": "keep",
              "from": "D",
              "to": "B",
              "candidate": 6,
              "distances": {
                "A": 0,
                "B": 2,
                "C": 1,
                "D": 4,
                "E": 4,
                "F": null
              },
              "predecessors": {
                "B": "A",
                "C": "A",
                "E": "B",
                "D": "B"
              },
              "frontier": [
                "E"
              ],
              "selected": [
                "A",
                "C",
                "B",
                "D"
              ]
            },
            "highlights": [
              {
                "from": "D",
                "to": "B"
              }
            ]
          },
          "codeFocus": [
            "for-neighbor",
            "candidate",
            "relax-condition"
          ]
        },
        {
          "id": "14-relax-D-F",
          "caption": "Dを経由するとFへのコストが6になるので、距離と前の場所を更新します。",
          "canvas": {
            "data": {
              "mode": "dijkstra",
              "graph": {
                "nodes": [
                  {
                    "id": "A",
                    "x": 0,
                    "y": 0
                  },
                  {
                    "id": "B",
                    "x": 2,
                    "y": 0
                  },
                  {
                    "id": "C",
                    "x": 0,
                    "y": 1
                  },
                  {
                    "id": "D",
                    "x": 4,
                    "y": 0
                  },
                  {
                    "id": "E",
                    "x": 3,
                    "y": 1
                  },
                  {
                    "id": "F",
                    "x": 6,
                    "y": 0
                  }
                ],
                "edges": [
                  {
                    "from": "A",
                    "to": "B",
                    "weight": 2
                  },
                  {
                    "from": "A",
                    "to": "C",
                    "weight": 1
                  },
                  {
                    "from": "B",
                    "to": "D",
                    "weight": 2
                  },
                  {
                    "from": "B",
                    "to": "E",
                    "weight": 2
                  },
                  {
                    "from": "C",
                    "to": "E",
                    "weight": 5
                  },
                  {
                    "from": "D",
                    "to": "F",
                    "weight": 2
                  },
                  {
                    "from": "E",
                    "to": "F",
                    "weight": 5
                  }
                ]
              },
              "heuristic": null
            },
            "state": {
              "operation": "relax",
              "from": "D",
              "to": "F",
              "candidate": 6,
              "distances": {
                "A": 0,
                "B": 2,
                "C": 1,
                "D": 4,
                "E": 4,
                "F": 6
              },
              "predecessors": {
                "B": "A",
                "C": "A",
                "E": "B",
                "D": "B",
                "F": "D"
              },
              "frontier": [
                "E",
                "F"
              ],
              "selected": [
                "A",
                "C",
                "B",
                "D"
              ]
            },
            "highlights": [
              {
                "from": "D",
                "to": "F"
              }
            ]
          },
          "codeFocus": [
            "for-neighbor",
            "candidate",
            "relax-condition",
            "update-distance",
            "update-parent",
            "add-frontier"
          ]
        },
        {
          "id": "15-select-E-none",
          "caption": "候補の中で移動コストが最小のE（4）を選びます。",
          "canvas": {
            "data": {
              "mode": "dijkstra",
              "graph": {
                "nodes": [
                  {
                    "id": "A",
                    "x": 0,
                    "y": 0
                  },
                  {
                    "id": "B",
                    "x": 2,
                    "y": 0
                  },
                  {
                    "id": "C",
                    "x": 0,
                    "y": 1
                  },
                  {
                    "id": "D",
                    "x": 4,
                    "y": 0
                  },
                  {
                    "id": "E",
                    "x": 3,
                    "y": 1
                  },
                  {
                    "id": "F",
                    "x": 6,
                    "y": 0
                  }
                ],
                "edges": [
                  {
                    "from": "A",
                    "to": "B",
                    "weight": 2
                  },
                  {
                    "from": "A",
                    "to": "C",
                    "weight": 1
                  },
                  {
                    "from": "B",
                    "to": "D",
                    "weight": 2
                  },
                  {
                    "from": "B",
                    "to": "E",
                    "weight": 2
                  },
                  {
                    "from": "C",
                    "to": "E",
                    "weight": 5
                  },
                  {
                    "from": "D",
                    "to": "F",
                    "weight": 2
                  },
                  {
                    "from": "E",
                    "to": "F",
                    "weight": 5
                  }
                ]
              },
              "heuristic": null
            },
            "state": {
              "operation": "select",
              "from": "E",
              "to": null,
              "candidate": null,
              "distances": {
                "A": 0,
                "B": 2,
                "C": 1,
                "D": 4,
                "E": 4,
                "F": 6
              },
              "predecessors": {
                "B": "A",
                "C": "A",
                "E": "B",
                "D": "B",
                "F": "D"
              },
              "frontier": [
                "F"
              ],
              "selected": [
                "A",
                "C",
                "B",
                "D",
                "E"
              ]
            },
            "highlights": []
          },
          "codeFocus": [
            "while-frontier",
            "select-min",
            "remove"
          ]
        },
        {
          "id": "16-keep-E-B",
          "caption": "Eを経由するとBへのコストは6となり、記録済みのコスト2より小さくないので更新しません。",
          "canvas": {
            "data": {
              "mode": "dijkstra",
              "graph": {
                "nodes": [
                  {
                    "id": "A",
                    "x": 0,
                    "y": 0
                  },
                  {
                    "id": "B",
                    "x": 2,
                    "y": 0
                  },
                  {
                    "id": "C",
                    "x": 0,
                    "y": 1
                  },
                  {
                    "id": "D",
                    "x": 4,
                    "y": 0
                  },
                  {
                    "id": "E",
                    "x": 3,
                    "y": 1
                  },
                  {
                    "id": "F",
                    "x": 6,
                    "y": 0
                  }
                ],
                "edges": [
                  {
                    "from": "A",
                    "to": "B",
                    "weight": 2
                  },
                  {
                    "from": "A",
                    "to": "C",
                    "weight": 1
                  },
                  {
                    "from": "B",
                    "to": "D",
                    "weight": 2
                  },
                  {
                    "from": "B",
                    "to": "E",
                    "weight": 2
                  },
                  {
                    "from": "C",
                    "to": "E",
                    "weight": 5
                  },
                  {
                    "from": "D",
                    "to": "F",
                    "weight": 2
                  },
                  {
                    "from": "E",
                    "to": "F",
                    "weight": 5
                  }
                ]
              },
              "heuristic": null
            },
            "state": {
              "operation": "keep",
              "from": "E",
              "to": "B",
              "candidate": 6,
              "distances": {
                "A": 0,
                "B": 2,
                "C": 1,
                "D": 4,
                "E": 4,
                "F": 6
              },
              "predecessors": {
                "B": "A",
                "C": "A",
                "E": "B",
                "D": "B",
                "F": "D"
              },
              "frontier": [
                "F"
              ],
              "selected": [
                "A",
                "C",
                "B",
                "D",
                "E"
              ]
            },
            "highlights": [
              {
                "from": "E",
                "to": "B"
              }
            ]
          },
          "codeFocus": [
            "for-neighbor",
            "candidate",
            "relax-condition"
          ]
        },
        {
          "id": "17-keep-E-C",
          "caption": "Eを経由するとCへのコストは9となり、記録済みのコスト1より小さくないので更新しません。",
          "canvas": {
            "data": {
              "mode": "dijkstra",
              "graph": {
                "nodes": [
                  {
                    "id": "A",
                    "x": 0,
                    "y": 0
                  },
                  {
                    "id": "B",
                    "x": 2,
                    "y": 0
                  },
                  {
                    "id": "C",
                    "x": 0,
                    "y": 1
                  },
                  {
                    "id": "D",
                    "x": 4,
                    "y": 0
                  },
                  {
                    "id": "E",
                    "x": 3,
                    "y": 1
                  },
                  {
                    "id": "F",
                    "x": 6,
                    "y": 0
                  }
                ],
                "edges": [
                  {
                    "from": "A",
                    "to": "B",
                    "weight": 2
                  },
                  {
                    "from": "A",
                    "to": "C",
                    "weight": 1
                  },
                  {
                    "from": "B",
                    "to": "D",
                    "weight": 2
                  },
                  {
                    "from": "B",
                    "to": "E",
                    "weight": 2
                  },
                  {
                    "from": "C",
                    "to": "E",
                    "weight": 5
                  },
                  {
                    "from": "D",
                    "to": "F",
                    "weight": 2
                  },
                  {
                    "from": "E",
                    "to": "F",
                    "weight": 5
                  }
                ]
              },
              "heuristic": null
            },
            "state": {
              "operation": "keep",
              "from": "E",
              "to": "C",
              "candidate": 9,
              "distances": {
                "A": 0,
                "B": 2,
                "C": 1,
                "D": 4,
                "E": 4,
                "F": 6
              },
              "predecessors": {
                "B": "A",
                "C": "A",
                "E": "B",
                "D": "B",
                "F": "D"
              },
              "frontier": [
                "F"
              ],
              "selected": [
                "A",
                "C",
                "B",
                "D",
                "E"
              ]
            },
            "highlights": [
              {
                "from": "E",
                "to": "C"
              }
            ]
          },
          "codeFocus": [
            "for-neighbor",
            "candidate",
            "relax-condition"
          ]
        },
        {
          "id": "18-keep-E-F",
          "caption": "Eを経由するとFへのコストは9となり、記録済みのコスト6より小さくないので更新しません。",
          "canvas": {
            "data": {
              "mode": "dijkstra",
              "graph": {
                "nodes": [
                  {
                    "id": "A",
                    "x": 0,
                    "y": 0
                  },
                  {
                    "id": "B",
                    "x": 2,
                    "y": 0
                  },
                  {
                    "id": "C",
                    "x": 0,
                    "y": 1
                  },
                  {
                    "id": "D",
                    "x": 4,
                    "y": 0
                  },
                  {
                    "id": "E",
                    "x": 3,
                    "y": 1
                  },
                  {
                    "id": "F",
                    "x": 6,
                    "y": 0
                  }
                ],
                "edges": [
                  {
                    "from": "A",
                    "to": "B",
                    "weight": 2
                  },
                  {
                    "from": "A",
                    "to": "C",
                    "weight": 1
                  },
                  {
                    "from": "B",
                    "to": "D",
                    "weight": 2
                  },
                  {
                    "from": "B",
                    "to": "E",
                    "weight": 2
                  },
                  {
                    "from": "C",
                    "to": "E",
                    "weight": 5
                  },
                  {
                    "from": "D",
                    "to": "F",
                    "weight": 2
                  },
                  {
                    "from": "E",
                    "to": "F",
                    "weight": 5
                  }
                ]
              },
              "heuristic": null
            },
            "state": {
              "operation": "keep",
              "from": "E",
              "to": "F",
              "candidate": 9,
              "distances": {
                "A": 0,
                "B": 2,
                "C": 1,
                "D": 4,
                "E": 4,
                "F": 6
              },
              "predecessors": {
                "B": "A",
                "C": "A",
                "E": "B",
                "D": "B",
                "F": "D"
              },
              "frontier": [
                "F"
              ],
              "selected": [
                "A",
                "C",
                "B",
                "D",
                "E"
              ]
            },
            "highlights": [
              {
                "from": "E",
                "to": "F"
              }
            ]
          },
          "codeFocus": [
            "for-neighbor",
            "candidate",
            "relax-condition"
          ]
        },
        {
          "id": "19-select-F-none",
          "caption": "候補の中で移動コストが最小のF（6）を選びます。",
          "canvas": {
            "data": {
              "mode": "dijkstra",
              "graph": {
                "nodes": [
                  {
                    "id": "A",
                    "x": 0,
                    "y": 0
                  },
                  {
                    "id": "B",
                    "x": 2,
                    "y": 0
                  },
                  {
                    "id": "C",
                    "x": 0,
                    "y": 1
                  },
                  {
                    "id": "D",
                    "x": 4,
                    "y": 0
                  },
                  {
                    "id": "E",
                    "x": 3,
                    "y": 1
                  },
                  {
                    "id": "F",
                    "x": 6,
                    "y": 0
                  }
                ],
                "edges": [
                  {
                    "from": "A",
                    "to": "B",
                    "weight": 2
                  },
                  {
                    "from": "A",
                    "to": "C",
                    "weight": 1
                  },
                  {
                    "from": "B",
                    "to": "D",
                    "weight": 2
                  },
                  {
                    "from": "B",
                    "to": "E",
                    "weight": 2
                  },
                  {
                    "from": "C",
                    "to": "E",
                    "weight": 5
                  },
                  {
                    "from": "D",
                    "to": "F",
                    "weight": 2
                  },
                  {
                    "from": "E",
                    "to": "F",
                    "weight": 5
                  }
                ]
              },
              "heuristic": null
            },
            "state": {
              "operation": "select",
              "from": "F",
              "to": null,
              "candidate": null,
              "distances": {
                "A": 0,
                "B": 2,
                "C": 1,
                "D": 4,
                "E": 4,
                "F": 6
              },
              "predecessors": {
                "B": "A",
                "C": "A",
                "E": "B",
                "D": "B",
                "F": "D"
              },
              "frontier": [],
              "selected": [
                "A",
                "C",
                "B",
                "D",
                "E",
                "F"
              ]
            },
            "highlights": []
          },
          "codeFocus": [
            "while-frontier",
            "select-min",
            "remove"
          ]
        },
        {
          "id": "20-finish-F-none",
          "caption": "ゴールFから前の場所をたどると、最短経路A→B→D→F（コスト6）が分かります。",
          "canvas": {
            "data": {
              "mode": "dijkstra",
              "graph": {
                "nodes": [
                  {
                    "id": "A",
                    "x": 0,
                    "y": 0
                  },
                  {
                    "id": "B",
                    "x": 2,
                    "y": 0
                  },
                  {
                    "id": "C",
                    "x": 0,
                    "y": 1
                  },
                  {
                    "id": "D",
                    "x": 4,
                    "y": 0
                  },
                  {
                    "id": "E",
                    "x": 3,
                    "y": 1
                  },
                  {
                    "id": "F",
                    "x": 6,
                    "y": 0
                  }
                ],
                "edges": [
                  {
                    "from": "A",
                    "to": "B",
                    "weight": 2
                  },
                  {
                    "from": "A",
                    "to": "C",
                    "weight": 1
                  },
                  {
                    "from": "B",
                    "to": "D",
                    "weight": 2
                  },
                  {
                    "from": "B",
                    "to": "E",
                    "weight": 2
                  },
                  {
                    "from": "C",
                    "to": "E",
                    "weight": 5
                  },
                  {
                    "from": "D",
                    "to": "F",
                    "weight": 2
                  },
                  {
                    "from": "E",
                    "to": "F",
                    "weight": 5
                  }
                ]
              },
              "heuristic": null
            },
            "state": {
              "operation": "finish",
              "from": "F",
              "to": null,
              "candidate": null,
              "distances": {
                "A": 0,
                "B": 2,
                "C": 1,
                "D": 4,
                "E": 4,
                "F": 6
              },
              "predecessors": {
                "B": "A",
                "C": "A",
                "E": "B",
                "D": "B",
                "F": "D"
              },
              "frontier": [],
              "selected": [
                "A",
                "C",
                "B",
                "D",
                "E",
                "F"
              ]
            },
            "highlights": []
          },
          "codeFocus": [
            "goal-check",
            "path-start",
            "path-loop",
            "reconstruct",
            "return-path"
          ]
        }
      ]
    },
    "check": {
      "version": 1,
      "kind": "concept-check",
      "id": "dijkstra-check",
      "phase": 3,
      "questions": [
        {
          "id": "next-first",
          "prompt": "次に選ぶ場所をタップしてください。",
          "stepId": "4-relax-A-C",
          "nodeIds": [
            "A",
            "B",
            "C",
            "D",
            "E",
            "F"
          ],
          "allowNone": false,
          "correctAnswer": {
            "kind": "node",
            "nodeId": "C"
          },
          "requires": null,
          "reviewStepIds": [
            "5-select-C-none"
          ],
          "tags": [
            "priority"
          ],
          "correctFeedback": "優先値が最小の候補を選べました。",
          "incorrectFeedback": "候補リストにある値を比べましょう。"
        },
        {
          "kind": "choice",
          "id": "update-first",
          "prompt": "CからEへ進むときに記録するコストはいくつですか？",
          "stepId": "5-select-C-none",
          "choices": [
            {
              "id": "c1",
              "text": "4"
            },
            {
              "id": "c2",
              "text": "6"
            },
            {
              "id": "c3",
              "text": "8"
            }
          ],
          "correctAnswer": {
            "kind": "choice",
            "choiceId": "c2"
          },
          "requires": null,
          "reviewStepIds": [
            "6-keep-C-A"
          ],
          "tags": [
            "relaxation"
          ],
          "correctFeedback": "その判断で合っています。",
          "incorrectFeedback": "候補の値と更新条件をもう一度確認してみましょう。"
        },
        {
          "id": "next-second",
          "prompt": "隣を調べ終えたあと、次に選ぶ場所はどれですか？",
          "stepId": "7-relax-C-E",
          "nodeIds": [
            "A",
            "B",
            "C",
            "D",
            "E",
            "F"
          ],
          "allowNone": false,
          "correctAnswer": {
            "kind": "node",
            "nodeId": "B"
          },
          "requires": null,
          "reviewStepIds": [
            "8-select-B-none"
          ],
          "tags": [
            "priority"
          ],
          "correctFeedback": "優先値が最小の候補を選べました。",
          "incorrectFeedback": "候補リストにある値を比べましょう。"
        },
        {
          "kind": "choice",
          "id": "update-second",
          "prompt": "BからEへ進むとき、Eのコストはいくつに更新されますか？",
          "stepId": "10-relax-B-D",
          "choices": [
            {
              "id": "c1",
              "text": "4"
            },
            {
              "id": "c2",
              "text": "6"
            },
            {
              "id": "c3",
              "text": "9"
            }
          ],
          "correctAnswer": {
            "kind": "choice",
            "choiceId": "c1"
          },
          "requires": null,
          "reviewStepIds": [
            "11-relax-B-E"
          ],
          "tags": [
            "relaxation"
          ],
          "correctFeedback": "その判断で合っています。",
          "incorrectFeedback": "候補の値と更新条件をもう一度確認してみましょう。"
        }
      ]
    },
    "codeCheck": {
      "version": 1,
      "kind": "code-blank-check",
      "id": "dijkstra-code-check",
      "phase": 5,
      "code": {
        "id": "dijkstra-v1",
        "version": 1,
        "language": "python",
        "lines": [
          {
            "id": "define-function",
            "text": "def dijkstra(graph, start, goal):"
          },
          {
            "id": "init-distance",
            "text": "    g = {start: 0}"
          },
          {
            "id": "init-parent",
            "text": "    parent = {}"
          },
          {
            "id": "init-frontier",
            "text": "    frontier = {start}"
          },
          {
            "id": "while-frontier",
            "text": "    while frontier:"
          },
          {
            "id": "select-min",
            "text": "        u = min(frontier, key=lambda n: (g[n], n))"
          },
          {
            "id": "remove",
            "text": "        frontier.remove(u)"
          },
          {
            "id": "goal-check",
            "text": "        if u == goal:"
          },
          {
            "id": "path-start",
            "text": "            path = [u]"
          },
          {
            "id": "path-loop",
            "text": "            while path[0] != start:"
          },
          {
            "id": "reconstruct",
            "text": "                path.insert(0, parent[path[0]])"
          },
          {
            "id": "return-path",
            "text": "            return (g[u], path)"
          },
          {
            "id": "for-neighbor",
            "text": "        for v, w in graph[u]:"
          },
          {
            "id": "candidate",
            "text": "            candidate = g[u] + w"
          },
          {
            "id": "relax-condition",
            "text": "            if candidate < g.get(v, float('inf')):"
          },
          {
            "id": "update-distance",
            "text": "                g[v] = candidate"
          },
          {
            "id": "update-parent",
            "text": "                parent[v] = u"
          },
          {
            "id": "add-frontier",
            "text": "                frontier.add(v)"
          },
          {
            "id": "unreachable",
            "text": "    return (None, [])"
          }
        ]
      },
      "questions": [
        {
          "kind": "code-blank",
          "id": "select-priority",
          "prompt": "最小の優先値を持つ候補を選ぶコードを補ってください。",
          "stepId": "5-select-C-none",
          "choices": [
            {
              "id": "c1",
              "text": "-g[n]"
            },
            {
              "id": "c2",
              "text": "g[n]"
            },
            {
              "id": "c3",
              "text": "0"
            }
          ],
          "correctAnswer": {
            "kind": "choice",
            "choiceId": "c2"
          },
          "requires": null,
          "reviewStepIds": [
            "6-keep-C-A"
          ],
          "tags": [
            "priority"
          ],
          "correctFeedback": "その判断で合っています。",
          "incorrectFeedback": "候補の値と更新条件をもう一度確認してみましょう。",
          "lineId": "select-min",
          "blank": {
            "start": 41,
            "length": 4
          }
        },
        {
          "kind": "code-blank",
          "id": "relax-condition",
          "prompt": "新しいコストが小さい場合だけ更新する条件を選んでください。",
          "stepId": "10-relax-B-D",
          "choices": [
            {
              "id": "c1",
              "text": ">"
            },
            {
              "id": "c2",
              "text": "=="
            },
            {
              "id": "c3",
              "text": "<"
            }
          ],
          "correctAnswer": {
            "kind": "choice",
            "choiceId": "c3"
          },
          "requires": null,
          "reviewStepIds": [
            "11-relax-B-E"
          ],
          "tags": [
            "relaxation"
          ],
          "correctFeedback": "その判断で合っています。",
          "incorrectFeedback": "候補の値と更新条件をもう一度確認してみましょう。",
          "lineId": "relax-condition",
          "blank": {
            "start": 25,
            "length": 1
          }
        },
        {
          "kind": "code-blank",
          "id": "update-g",
          "prompt": "新しい移動コストを記録するコードを選んでください。",
          "stepId": "10-relax-B-D",
          "choices": [
            {
              "id": "c1",
              "text": "w"
            },
            {
              "id": "c2",
              "text": "candidate"
            },
            {
              "id": "c3",
              "text": "g[u]"
            }
          ],
          "correctAnswer": {
            "kind": "choice",
            "choiceId": "c2"
          },
          "requires": null,
          "reviewStepIds": [
            "11-relax-B-E"
          ],
          "tags": [
            "relaxation"
          ],
          "correctFeedback": "その判断で合っています。",
          "incorrectFeedback": "候補の値と更新条件をもう一度確認してみましょう。",
          "lineId": "update-distance",
          "blank": {
            "start": 23,
            "length": 9
          }
        },
        {
          "kind": "code-blank",
          "id": "parent",
          "prompt": "直前に通った場所を記録するコードを選んでください。",
          "stepId": "11-relax-B-E",
          "choices": [
            {
              "id": "c1",
              "text": "= v"
            },
            {
              "id": "c2",
              "text": "= goal"
            },
            {
              "id": "c3",
              "text": "= u"
            }
          ],
          "correctAnswer": {
            "kind": "choice",
            "choiceId": "c3"
          },
          "requires": null,
          "reviewStepIds": [
            "12-select-D-none"
          ],
          "tags": [
            "path"
          ],
          "correctFeedback": "その判断で合っています。",
          "incorrectFeedback": "候補の値と更新条件をもう一度確認してみましょう。",
          "lineId": "update-parent",
          "blank": {
            "start": 26,
            "length": 3
          }
        },
        {
          "kind": "code-blank",
          "id": "goal",
          "prompt": "ゴールを選んだときに探索を終える条件を選んでください。",
          "stepId": "19-select-F-none",
          "choices": [
            {
              "id": "c1",
              "text": "u == goal"
            },
            {
              "id": "c2",
              "text": "u == start"
            },
            {
              "id": "c3",
              "text": "not frontier"
            }
          ],
          "correctAnswer": {
            "kind": "choice",
            "choiceId": "c1"
          },
          "requires": null,
          "reviewStepIds": [
            "20-finish-F-none"
          ],
          "tags": [
            "path"
          ],
          "correctFeedback": "その判断で合っています。",
          "incorrectFeedback": "候補の値と更新条件をもう一度確認してみましょう。",
          "lineId": "goal-check",
          "blank": {
            "start": 11,
            "length": 9
          }
        }
      ]
    },
    "consolidation": {
      "version": 1,
      "kind": "diagnostic-check",
      "id": "dijkstra-consolidation",
      "phase": 6,
      "code": {
        "id": "dijkstra-v1",
        "version": 1,
        "language": "python",
        "lines": [
          {
            "id": "define-function",
            "text": "def dijkstra(graph, start, goal):"
          },
          {
            "id": "init-distance",
            "text": "    g = {start: 0}"
          },
          {
            "id": "init-parent",
            "text": "    parent = {}"
          },
          {
            "id": "init-frontier",
            "text": "    frontier = {start}"
          },
          {
            "id": "while-frontier",
            "text": "    while frontier:"
          },
          {
            "id": "select-min",
            "text": "        u = min(frontier, key=lambda n: (g[n], n))"
          },
          {
            "id": "remove",
            "text": "        frontier.remove(u)"
          },
          {
            "id": "goal-check",
            "text": "        if u == goal:"
          },
          {
            "id": "path-start",
            "text": "            path = [u]"
          },
          {
            "id": "path-loop",
            "text": "            while path[0] != start:"
          },
          {
            "id": "reconstruct",
            "text": "                path.insert(0, parent[path[0]])"
          },
          {
            "id": "return-path",
            "text": "            return (g[u], path)"
          },
          {
            "id": "for-neighbor",
            "text": "        for v, w in graph[u]:"
          },
          {
            "id": "candidate",
            "text": "            candidate = g[u] + w"
          },
          {
            "id": "relax-condition",
            "text": "            if candidate < g.get(v, float('inf')):"
          },
          {
            "id": "update-distance",
            "text": "                g[v] = candidate"
          },
          {
            "id": "update-parent",
            "text": "                parent[v] = u"
          },
          {
            "id": "add-frontier",
            "text": "                frontier.add(v)"
          },
          {
            "id": "unreachable",
            "text": "    return (None, [])"
          }
        ]
      },
      "questions": [
        {
          "kind": "choice",
          "id": "transfer-cost",
          "prompt": "この別のグラフでSからTまでの最小コストはいくつですか？",
          "stepId": "5-select-C-none",
          "choices": [
            {
              "id": "c1",
              "text": "7"
            },
            {
              "id": "c2",
              "text": "10"
            },
            {
              "id": "c3",
              "text": "12"
            }
          ],
          "correctAnswer": {
            "kind": "choice",
            "choiceId": "c1"
          },
          "requires": null,
          "reviewStepIds": [
            "6-keep-C-A"
          ],
          "tags": [
            "relaxation"
          ],
          "correctFeedback": "その判断で合っています。",
          "incorrectFeedback": "候補の値と更新条件をもう一度確認してみましょう。",
          "scene": {
            "kind": "weighted-transfer",
            "edges": [
              [
                "S",
                "X",
                8
              ],
              [
                "S",
                "Y",
                2
              ],
              [
                "Y",
                "X",
                2
              ],
              [
                "X",
                "T",
                3
              ],
              [
                "Y",
                "T",
                10
              ]
            ],
            "start": "S",
            "goal": "T",
            "heuristic": null
          }
        },
        {
          "kind": "choice",
          "id": "transfer-update",
          "prompt": "Yを経由するとXへのコスト8は何に更新されますか？",
          "stepId": "5-select-C-none",
          "choices": [
            {
              "id": "c1",
              "text": "2"
            },
            {
              "id": "c2",
              "text": "4"
            },
            {
              "id": "c3",
              "text": "8"
            }
          ],
          "correctAnswer": {
            "kind": "choice",
            "choiceId": "c2"
          },
          "requires": null,
          "reviewStepIds": [
            "6-keep-C-A"
          ],
          "tags": [
            "relaxation"
          ],
          "correctFeedback": "その判断で合っています。",
          "incorrectFeedback": "候補の値と更新条件をもう一度確認してみましょう。",
          "scene": {
            "kind": "weighted-transfer",
            "edges": [
              [
                "S",
                "X",
                8
              ],
              [
                "S",
                "Y",
                2
              ],
              [
                "Y",
                "X",
                2
              ],
              [
                "X",
                "T",
                3
              ],
              [
                "Y",
                "T",
                10
              ]
            ],
            "start": "S",
            "goal": "T",
            "heuristic": null
          }
        },
        {
          "kind": "choice",
          "id": "unreachable",
          "prompt": "ゴールを選べないまま候補が空になったら、どう判断しますか？",
          "stepId": "20-finish-F-none",
          "choices": [
            {
              "id": "c1",
              "text": "到達不能"
            },
            {
              "id": "c2",
              "text": "最後の場所がゴール"
            },
            {
              "id": "c3",
              "text": "コスト0"
            }
          ],
          "correctAnswer": {
            "kind": "choice",
            "choiceId": "c1"
          },
          "requires": null,
          "reviewStepIds": [
            "20-finish-F-none"
          ],
          "tags": [
            "path"
          ],
          "correctFeedback": "その判断で合っています。",
          "incorrectFeedback": "候補の値と更新条件をもう一度確認してみましょう。"
        },
        {
          "kind": "choice",
          "id": "nonnegative",
          "prompt": "ダイクストラ法で最短を保証するために必要な辺コストの条件は？",
          "stepId": "5-select-C-none",
          "choices": [
            {
              "id": "c1",
              "text": "すべて同じ"
            },
            {
              "id": "c2",
              "text": "すべて非負"
            },
            {
              "id": "c3",
              "text": "すべて負"
            }
          ],
          "correctAnswer": {
            "kind": "choice",
            "choiceId": "c2"
          },
          "requires": null,
          "reviewStepIds": [
            "6-keep-C-A"
          ],
          "tags": [
            "priority"
          ],
          "correctFeedback": "その判断で合っています。",
          "incorrectFeedback": "候補の値と更新条件をもう一度確認してみましょう。"
        },
        {
          "kind": "parsons",
          "id": "code-order",
          "prompt": "候補の選択から隣の更新まで、コードを正しい順番に並べてください。",
          "stepId": "5-select-C-none",
          "lineIds": [
            "remove",
            "goal-check",
            "select-min",
            "candidate",
            "add-frontier",
            "for-neighbor",
            "update-parent",
            "relax-condition",
            "update-distance",
            "path-start",
            "path-loop",
            "reconstruct",
            "return-path"
          ],
          "correctAnswer": {
            "kind": "order",
            "lineIds": [
              "select-min",
              "remove",
              "goal-check",
              "path-start",
              "path-loop",
              "reconstruct",
              "return-path",
              "for-neighbor",
              "candidate",
              "relax-condition",
              "update-distance",
              "update-parent",
              "add-frontier"
            ]
          },
          "fixedLineIds": [
            "path-start",
            "path-loop",
            "reconstruct",
            "return-path"
          ],
          "requires": null,
          "reviewStepIds": [
            "5-select-C-none",
            "10-relax-B-D"
          ],
          "tags": [
            "flow"
          ],
          "correctFeedback": "探索の順番を正しく組み立てられました。",
          "incorrectFeedback": "候補選択、終了判定、隣の更新の順で考えましょう。"
        }
      ]
    },
    "code": {
      "id": "dijkstra-v1",
      "version": 1,
      "language": "python",
      "lines": [
        {
          "id": "define-function",
          "text": "def dijkstra(graph, start, goal):"
        },
        {
          "id": "init-distance",
          "text": "    g = {start: 0}"
        },
        {
          "id": "init-parent",
          "text": "    parent = {}"
        },
        {
          "id": "init-frontier",
          "text": "    frontier = {start}"
        },
        {
          "id": "while-frontier",
          "text": "    while frontier:"
        },
        {
          "id": "select-min",
          "text": "        u = min(frontier, key=lambda n: (g[n], n))"
        },
        {
          "id": "remove",
          "text": "        frontier.remove(u)"
        },
        {
          "id": "goal-check",
          "text": "        if u == goal:"
        },
        {
          "id": "path-start",
          "text": "            path = [u]"
        },
        {
          "id": "path-loop",
          "text": "            while path[0] != start:"
        },
        {
          "id": "reconstruct",
          "text": "                path.insert(0, parent[path[0]])"
        },
        {
          "id": "return-path",
          "text": "            return (g[u], path)"
        },
        {
          "id": "for-neighbor",
          "text": "        for v, w in graph[u]:"
        },
        {
          "id": "candidate",
          "text": "            candidate = g[u] + w"
        },
        {
          "id": "relax-condition",
          "text": "            if candidate < g.get(v, float('inf')):"
        },
        {
          "id": "update-distance",
          "text": "                g[v] = candidate"
        },
        {
          "id": "update-parent",
          "text": "                parent[v] = u"
        },
        {
          "id": "add-frontier",
          "text": "                frontier.add(v)"
        },
        {
          "id": "unreachable",
          "text": "    return (None, [])"
        }
      ]
    }
  },
  "astar": {
    "courseId": "course-algorithm-astar-v1",
    "title": "A*探索",
    "intro": "ゴールまでの推定コストを利用し、最短経路を求めるA*探索を学びます。",
    "phases": [
      {
        "phase": 1,
        "id": "astar-motivation",
        "shortName": "導入",
        "formalName": "導入",
        "transitionOut": "bridge"
      },
      {
        "phase": 2,
        "id": "astar-execution",
        "shortName": "動きの説明",
        "formalName": "動きの説明",
        "transitionOut": "bridge",
        "bridge": "候補を選ぶ順番と移動コストの更新を追ってみましょう。",
        "cardRarity": "RARE"
      },
      {
        "phase": 3,
        "id": "astar-check",
        "shortName": "動きの確認",
        "formalName": "動きの確認問題",
        "transitionOut": "result",
        "bridge": "図を見て、次の操作と更新後のコストを確かめましょう。",
        "result": {
          "heading": "動きの確認問題が終わりました"
        }
      },
      {
        "phase": 4,
        "id": "astar-code-mapping",
        "shortName": "動きとコード",
        "formalName": "動きとコードの対応",
        "transitionOut": "bridge",
        "bridge": "今の動きがコードでどう表現されるか見てみましょう。"
      },
      {
        "phase": 5,
        "id": "astar-code-check",
        "shortName": "コードの確認",
        "formalName": "コードの確認問題",
        "transitionOut": "result",
        "bridge": "コードの空欄を埋めて、各処理の役割を確かめましょう。",
        "cardRarity": "COMMON",
        "result": {
          "heading": "コードの確認問題が終わりました"
        }
      },
      {
        "phase": 6,
        "id": "astar-consolidation",
        "shortName": "応用問題",
        "formalName": "応用問題",
        "transitionOut": "result",
        "bridge": "異なる地図や境界ケースで考え方を使ってみましょう。",
        "result": {
          "heading": "応用問題が終わりました"
        }
      },
      {
        "phase": 7,
        "id": "astar-implementation",
        "shortName": "自分で実装",
        "formalName": "自分で実装",
        "transitionOut": "final",
        "bridge": "最後は最短経路を返すプログラムを自分で完成させましょう。",
        "cardRarity": "EPIC"
      }
    ],
    "motivation": {
      "version": 1,
      "kind": "step-sequence",
      "id": "astar-motivation",
      "phase": 1,
      "intervalMs": 3500,
      "steps": [
        {
          "id": "intro-1",
          "caption": "ダイクストラ法は最短経路を見つけるためにCやEも調べました。",
          "canvas": {
            "data": {
              "mode": "astar",
              "graph": {
                "nodes": [
                  {
                    "id": "A",
                    "x": 0,
                    "y": 0
                  },
                  {
                    "id": "B",
                    "x": 2,
                    "y": 0
                  },
                  {
                    "id": "C",
                    "x": 0,
                    "y": 1
                  },
                  {
                    "id": "D",
                    "x": 4,
                    "y": 0
                  },
                  {
                    "id": "E",
                    "x": 3,
                    "y": 1
                  },
                  {
                    "id": "F",
                    "x": 6,
                    "y": 0
                  }
                ],
                "edges": [
                  {
                    "from": "A",
                    "to": "B",
                    "weight": 2
                  },
                  {
                    "from": "A",
                    "to": "C",
                    "weight": 1
                  },
                  {
                    "from": "B",
                    "to": "D",
                    "weight": 2
                  },
                  {
                    "from": "B",
                    "to": "E",
                    "weight": 2
                  },
                  {
                    "from": "C",
                    "to": "E",
                    "weight": 5
                  },
                  {
                    "from": "D",
                    "to": "F",
                    "weight": 2
                  },
                  {
                    "from": "E",
                    "to": "F",
                    "weight": 5
                  }
                ]
              },
              "heuristic": {
                "A": 6,
                "B": 4,
                "C": 7,
                "D": 2,
                "E": 4,
                "F": 0
              },
              "introStage": 1,
              "introPath": []
            },
            "state": {
              "operation": "init",
              "from": null,
              "to": null,
              "candidate": null,
              "distances": {
                "A": 0,
                "B": null,
                "C": null,
                "D": null,
                "E": null,
                "F": null
              },
              "predecessors": {},
              "frontier": [
                "A"
              ],
              "selected": []
            },
            "highlights": []
          }
        },
        {
          "id": "intro-2",
          "caption": "地図を見れば、ゴールまで少なくともどれくらい移動するか見積もれます。",
          "canvas": {
            "data": {
              "mode": "astar",
              "graph": {
                "nodes": [
                  {
                    "id": "A",
                    "x": 0,
                    "y": 0
                  },
                  {
                    "id": "B",
                    "x": 2,
                    "y": 0
                  },
                  {
                    "id": "C",
                    "x": 0,
                    "y": 1
                  },
                  {
                    "id": "D",
                    "x": 4,
                    "y": 0
                  },
                  {
                    "id": "E",
                    "x": 3,
                    "y": 1
                  },
                  {
                    "id": "F",
                    "x": 6,
                    "y": 0
                  }
                ],
                "edges": [
                  {
                    "from": "A",
                    "to": "B",
                    "weight": 2
                  },
                  {
                    "from": "A",
                    "to": "C",
                    "weight": 1
                  },
                  {
                    "from": "B",
                    "to": "D",
                    "weight": 2
                  },
                  {
                    "from": "B",
                    "to": "E",
                    "weight": 2
                  },
                  {
                    "from": "C",
                    "to": "E",
                    "weight": 5
                  },
                  {
                    "from": "D",
                    "to": "F",
                    "weight": 2
                  },
                  {
                    "from": "E",
                    "to": "F",
                    "weight": 5
                  }
                ]
              },
              "heuristic": {
                "A": 6,
                "B": 4,
                "C": 7,
                "D": 2,
                "E": 4,
                "F": 0
              },
              "introStage": 2,
              "introPath": []
            },
            "state": {
              "operation": "init",
              "from": null,
              "to": null,
              "candidate": null,
              "distances": {
                "A": 0,
                "B": null,
                "C": null,
                "D": null,
                "E": null,
                "F": null
              },
              "predecessors": {},
              "frontier": [
                "A"
              ],
              "selected": []
            },
            "highlights": []
          }
        },
        {
          "id": "intro-3",
          "caption": "Bの移動コストは2、残りの推定コストは4なので、合計は6です。",
          "canvas": {
            "data": {
              "mode": "astar",
              "graph": {
                "nodes": [
                  {
                    "id": "A",
                    "x": 0,
                    "y": 0
                  },
                  {
                    "id": "B",
                    "x": 2,
                    "y": 0
                  },
                  {
                    "id": "C",
                    "x": 0,
                    "y": 1
                  },
                  {
                    "id": "D",
                    "x": 4,
                    "y": 0
                  },
                  {
                    "id": "E",
                    "x": 3,
                    "y": 1
                  },
                  {
                    "id": "F",
                    "x": 6,
                    "y": 0
                  }
                ],
                "edges": [
                  {
                    "from": "A",
                    "to": "B",
                    "weight": 2
                  },
                  {
                    "from": "A",
                    "to": "C",
                    "weight": 1
                  },
                  {
                    "from": "B",
                    "to": "D",
                    "weight": 2
                  },
                  {
                    "from": "B",
                    "to": "E",
                    "weight": 2
                  },
                  {
                    "from": "C",
                    "to": "E",
                    "weight": 5
                  },
                  {
                    "from": "D",
                    "to": "F",
                    "weight": 2
                  },
                  {
                    "from": "E",
                    "to": "F",
                    "weight": 5
                  }
                ]
              },
              "heuristic": {
                "A": 6,
                "B": 4,
                "C": 7,
                "D": 2,
                "E": 4,
                "F": 0
              },
              "introStage": 3,
              "introPath": []
            },
            "state": {
              "operation": "relax",
              "from": "A",
              "to": "C",
              "candidate": 1,
              "distances": {
                "A": 0,
                "B": 2,
                "C": 1,
                "D": null,
                "E": null,
                "F": null
              },
              "predecessors": {
                "B": "A",
                "C": "A"
              },
              "frontier": [
                "B",
                "C"
              ],
              "selected": [
                "A"
              ]
            },
            "highlights": [
              {
                "from": "A",
                "to": "C"
              }
            ]
          }
        },
        {
          "id": "intro-4",
          "caption": "Cの合計は8なので、移動コストだけではなく合計が小さいBを先に選べます。",
          "canvas": {
            "data": {
              "mode": "astar",
              "graph": {
                "nodes": [
                  {
                    "id": "A",
                    "x": 0,
                    "y": 0
                  },
                  {
                    "id": "B",
                    "x": 2,
                    "y": 0
                  },
                  {
                    "id": "C",
                    "x": 0,
                    "y": 1
                  },
                  {
                    "id": "D",
                    "x": 4,
                    "y": 0
                  },
                  {
                    "id": "E",
                    "x": 3,
                    "y": 1
                  },
                  {
                    "id": "F",
                    "x": 6,
                    "y": 0
                  }
                ],
                "edges": [
                  {
                    "from": "A",
                    "to": "B",
                    "weight": 2
                  },
                  {
                    "from": "A",
                    "to": "C",
                    "weight": 1
                  },
                  {
                    "from": "B",
                    "to": "D",
                    "weight": 2
                  },
                  {
                    "from": "B",
                    "to": "E",
                    "weight": 2
                  },
                  {
                    "from": "C",
                    "to": "E",
                    "weight": 5
                  },
                  {
                    "from": "D",
                    "to": "F",
                    "weight": 2
                  },
                  {
                    "from": "E",
                    "to": "F",
                    "weight": 5
                  }
                ]
              },
              "heuristic": {
                "A": 6,
                "B": 4,
                "C": 7,
                "D": 2,
                "E": 4,
                "F": 0
              },
              "introStage": 4,
              "introPath": []
            },
            "state": {
              "operation": "relax",
              "from": "A",
              "to": "C",
              "candidate": 1,
              "distances": {
                "A": 0,
                "B": 2,
                "C": 1,
                "D": null,
                "E": null,
                "F": null
              },
              "predecessors": {
                "B": "A",
                "C": "A"
              },
              "frontier": [
                "B",
                "C"
              ],
              "selected": [
                "A"
              ]
            },
            "highlights": [
              {
                "from": "A",
                "to": "C"
              }
            ]
          }
        },
        {
          "id": "intro-5",
          "caption": "このようにゴールへの見積もりを使う方法をA*探索と呼びます。",
          "canvas": {
            "data": {
              "mode": "astar",
              "graph": {
                "nodes": [
                  {
                    "id": "A",
                    "x": 0,
                    "y": 0
                  },
                  {
                    "id": "B",
                    "x": 2,
                    "y": 0
                  },
                  {
                    "id": "C",
                    "x": 0,
                    "y": 1
                  },
                  {
                    "id": "D",
                    "x": 4,
                    "y": 0
                  },
                  {
                    "id": "E",
                    "x": 3,
                    "y": 1
                  },
                  {
                    "id": "F",
                    "x": 6,
                    "y": 0
                  }
                ],
                "edges": [
                  {
                    "from": "A",
                    "to": "B",
                    "weight": 2
                  },
                  {
                    "from": "A",
                    "to": "C",
                    "weight": 1
                  },
                  {
                    "from": "B",
                    "to": "D",
                    "weight": 2
                  },
                  {
                    "from": "B",
                    "to": "E",
                    "weight": 2
                  },
                  {
                    "from": "C",
                    "to": "E",
                    "weight": 5
                  },
                  {
                    "from": "D",
                    "to": "F",
                    "weight": 2
                  },
                  {
                    "from": "E",
                    "to": "F",
                    "weight": 5
                  }
                ]
              },
              "heuristic": {
                "A": 6,
                "B": 4,
                "C": 7,
                "D": 2,
                "E": 4,
                "F": 0
              },
              "introStage": 5,
              "introPath": []
            },
            "state": {
              "operation": "relax",
              "from": "A",
              "to": "C",
              "candidate": 1,
              "distances": {
                "A": 0,
                "B": 2,
                "C": 1,
                "D": null,
                "E": null,
                "F": null
              },
              "predecessors": {
                "B": "A",
                "C": "A"
              },
              "frontier": [
                "B",
                "C"
              ],
              "selected": [
                "A"
              ]
            },
            "highlights": [
              {
                "from": "A",
                "to": "C"
              }
            ]
          }
        }
      ]
    },
    "execution": {
      "version": 1,
      "kind": "step-sequence",
      "id": "astar-execution",
      "phase": 2,
      "intervalMs": 3500,
      "steps": [
        {
          "id": "1-init-start-none",
          "caption": "出発点Aまでの移動コストを0として、候補に追加します。",
          "canvas": {
            "data": {
              "mode": "astar",
              "graph": {
                "nodes": [
                  {
                    "id": "A",
                    "x": 0,
                    "y": 0
                  },
                  {
                    "id": "B",
                    "x": 2,
                    "y": 0
                  },
                  {
                    "id": "C",
                    "x": 0,
                    "y": 1
                  },
                  {
                    "id": "D",
                    "x": 4,
                    "y": 0
                  },
                  {
                    "id": "E",
                    "x": 3,
                    "y": 1
                  },
                  {
                    "id": "F",
                    "x": 6,
                    "y": 0
                  }
                ],
                "edges": [
                  {
                    "from": "A",
                    "to": "B",
                    "weight": 2
                  },
                  {
                    "from": "A",
                    "to": "C",
                    "weight": 1
                  },
                  {
                    "from": "B",
                    "to": "D",
                    "weight": 2
                  },
                  {
                    "from": "B",
                    "to": "E",
                    "weight": 2
                  },
                  {
                    "from": "C",
                    "to": "E",
                    "weight": 5
                  },
                  {
                    "from": "D",
                    "to": "F",
                    "weight": 2
                  },
                  {
                    "from": "E",
                    "to": "F",
                    "weight": 5
                  }
                ]
              },
              "heuristic": {
                "A": 6,
                "B": 4,
                "C": 7,
                "D": 2,
                "E": 4,
                "F": 0
              }
            },
            "state": {
              "operation": "init",
              "from": null,
              "to": null,
              "candidate": null,
              "distances": {
                "A": 0,
                "B": null,
                "C": null,
                "D": null,
                "E": null,
                "F": null
              },
              "predecessors": {},
              "frontier": [
                "A"
              ],
              "selected": []
            },
            "highlights": []
          }
        },
        {
          "id": "2-select-A-none",
          "caption": "候補の中で移動コストと残りの推定コストの合計が最小のA（6）を選びます。",
          "canvas": {
            "data": {
              "mode": "astar",
              "graph": {
                "nodes": [
                  {
                    "id": "A",
                    "x": 0,
                    "y": 0
                  },
                  {
                    "id": "B",
                    "x": 2,
                    "y": 0
                  },
                  {
                    "id": "C",
                    "x": 0,
                    "y": 1
                  },
                  {
                    "id": "D",
                    "x": 4,
                    "y": 0
                  },
                  {
                    "id": "E",
                    "x": 3,
                    "y": 1
                  },
                  {
                    "id": "F",
                    "x": 6,
                    "y": 0
                  }
                ],
                "edges": [
                  {
                    "from": "A",
                    "to": "B",
                    "weight": 2
                  },
                  {
                    "from": "A",
                    "to": "C",
                    "weight": 1
                  },
                  {
                    "from": "B",
                    "to": "D",
                    "weight": 2
                  },
                  {
                    "from": "B",
                    "to": "E",
                    "weight": 2
                  },
                  {
                    "from": "C",
                    "to": "E",
                    "weight": 5
                  },
                  {
                    "from": "D",
                    "to": "F",
                    "weight": 2
                  },
                  {
                    "from": "E",
                    "to": "F",
                    "weight": 5
                  }
                ]
              },
              "heuristic": {
                "A": 6,
                "B": 4,
                "C": 7,
                "D": 2,
                "E": 4,
                "F": 0
              }
            },
            "state": {
              "operation": "select",
              "from": "A",
              "to": null,
              "candidate": null,
              "distances": {
                "A": 0,
                "B": null,
                "C": null,
                "D": null,
                "E": null,
                "F": null
              },
              "predecessors": {},
              "frontier": [],
              "selected": [
                "A"
              ]
            },
            "highlights": []
          }
        },
        {
          "id": "3-relax-A-B",
          "caption": "Aを経由するとBへのコストが2になるので、距離と前の場所を更新します。",
          "canvas": {
            "data": {
              "mode": "astar",
              "graph": {
                "nodes": [
                  {
                    "id": "A",
                    "x": 0,
                    "y": 0
                  },
                  {
                    "id": "B",
                    "x": 2,
                    "y": 0
                  },
                  {
                    "id": "C",
                    "x": 0,
                    "y": 1
                  },
                  {
                    "id": "D",
                    "x": 4,
                    "y": 0
                  },
                  {
                    "id": "E",
                    "x": 3,
                    "y": 1
                  },
                  {
                    "id": "F",
                    "x": 6,
                    "y": 0
                  }
                ],
                "edges": [
                  {
                    "from": "A",
                    "to": "B",
                    "weight": 2
                  },
                  {
                    "from": "A",
                    "to": "C",
                    "weight": 1
                  },
                  {
                    "from": "B",
                    "to": "D",
                    "weight": 2
                  },
                  {
                    "from": "B",
                    "to": "E",
                    "weight": 2
                  },
                  {
                    "from": "C",
                    "to": "E",
                    "weight": 5
                  },
                  {
                    "from": "D",
                    "to": "F",
                    "weight": 2
                  },
                  {
                    "from": "E",
                    "to": "F",
                    "weight": 5
                  }
                ]
              },
              "heuristic": {
                "A": 6,
                "B": 4,
                "C": 7,
                "D": 2,
                "E": 4,
                "F": 0
              }
            },
            "state": {
              "operation": "relax",
              "from": "A",
              "to": "B",
              "candidate": 2,
              "distances": {
                "A": 0,
                "B": 2,
                "C": null,
                "D": null,
                "E": null,
                "F": null
              },
              "predecessors": {
                "B": "A"
              },
              "frontier": [
                "B"
              ],
              "selected": [
                "A"
              ]
            },
            "highlights": [
              {
                "from": "A",
                "to": "B"
              }
            ]
          }
        },
        {
          "id": "4-relax-A-C",
          "caption": "Aを経由するとCへのコストが1になるので、距離と前の場所を更新します。",
          "canvas": {
            "data": {
              "mode": "astar",
              "graph": {
                "nodes": [
                  {
                    "id": "A",
                    "x": 0,
                    "y": 0
                  },
                  {
                    "id": "B",
                    "x": 2,
                    "y": 0
                  },
                  {
                    "id": "C",
                    "x": 0,
                    "y": 1
                  },
                  {
                    "id": "D",
                    "x": 4,
                    "y": 0
                  },
                  {
                    "id": "E",
                    "x": 3,
                    "y": 1
                  },
                  {
                    "id": "F",
                    "x": 6,
                    "y": 0
                  }
                ],
                "edges": [
                  {
                    "from": "A",
                    "to": "B",
                    "weight": 2
                  },
                  {
                    "from": "A",
                    "to": "C",
                    "weight": 1
                  },
                  {
                    "from": "B",
                    "to": "D",
                    "weight": 2
                  },
                  {
                    "from": "B",
                    "to": "E",
                    "weight": 2
                  },
                  {
                    "from": "C",
                    "to": "E",
                    "weight": 5
                  },
                  {
                    "from": "D",
                    "to": "F",
                    "weight": 2
                  },
                  {
                    "from": "E",
                    "to": "F",
                    "weight": 5
                  }
                ]
              },
              "heuristic": {
                "A": 6,
                "B": 4,
                "C": 7,
                "D": 2,
                "E": 4,
                "F": 0
              }
            },
            "state": {
              "operation": "relax",
              "from": "A",
              "to": "C",
              "candidate": 1,
              "distances": {
                "A": 0,
                "B": 2,
                "C": 1,
                "D": null,
                "E": null,
                "F": null
              },
              "predecessors": {
                "B": "A",
                "C": "A"
              },
              "frontier": [
                "B",
                "C"
              ],
              "selected": [
                "A"
              ]
            },
            "highlights": [
              {
                "from": "A",
                "to": "C"
              }
            ]
          }
        },
        {
          "id": "5-select-B-none",
          "caption": "候補の中で移動コストと残りの推定コストの合計が最小のB（6）を選びます。",
          "canvas": {
            "data": {
              "mode": "astar",
              "graph": {
                "nodes": [
                  {
                    "id": "A",
                    "x": 0,
                    "y": 0
                  },
                  {
                    "id": "B",
                    "x": 2,
                    "y": 0
                  },
                  {
                    "id": "C",
                    "x": 0,
                    "y": 1
                  },
                  {
                    "id": "D",
                    "x": 4,
                    "y": 0
                  },
                  {
                    "id": "E",
                    "x": 3,
                    "y": 1
                  },
                  {
                    "id": "F",
                    "x": 6,
                    "y": 0
                  }
                ],
                "edges": [
                  {
                    "from": "A",
                    "to": "B",
                    "weight": 2
                  },
                  {
                    "from": "A",
                    "to": "C",
                    "weight": 1
                  },
                  {
                    "from": "B",
                    "to": "D",
                    "weight": 2
                  },
                  {
                    "from": "B",
                    "to": "E",
                    "weight": 2
                  },
                  {
                    "from": "C",
                    "to": "E",
                    "weight": 5
                  },
                  {
                    "from": "D",
                    "to": "F",
                    "weight": 2
                  },
                  {
                    "from": "E",
                    "to": "F",
                    "weight": 5
                  }
                ]
              },
              "heuristic": {
                "A": 6,
                "B": 4,
                "C": 7,
                "D": 2,
                "E": 4,
                "F": 0
              }
            },
            "state": {
              "operation": "select",
              "from": "B",
              "to": null,
              "candidate": null,
              "distances": {
                "A": 0,
                "B": 2,
                "C": 1,
                "D": null,
                "E": null,
                "F": null
              },
              "predecessors": {
                "B": "A",
                "C": "A"
              },
              "frontier": [
                "C"
              ],
              "selected": [
                "A",
                "B"
              ]
            },
            "highlights": []
          }
        },
        {
          "id": "6-keep-B-A",
          "caption": "Bを経由するとAへのコストは4となり、記録済みのコスト0より小さくないので更新しません。",
          "canvas": {
            "data": {
              "mode": "astar",
              "graph": {
                "nodes": [
                  {
                    "id": "A",
                    "x": 0,
                    "y": 0
                  },
                  {
                    "id": "B",
                    "x": 2,
                    "y": 0
                  },
                  {
                    "id": "C",
                    "x": 0,
                    "y": 1
                  },
                  {
                    "id": "D",
                    "x": 4,
                    "y": 0
                  },
                  {
                    "id": "E",
                    "x": 3,
                    "y": 1
                  },
                  {
                    "id": "F",
                    "x": 6,
                    "y": 0
                  }
                ],
                "edges": [
                  {
                    "from": "A",
                    "to": "B",
                    "weight": 2
                  },
                  {
                    "from": "A",
                    "to": "C",
                    "weight": 1
                  },
                  {
                    "from": "B",
                    "to": "D",
                    "weight": 2
                  },
                  {
                    "from": "B",
                    "to": "E",
                    "weight": 2
                  },
                  {
                    "from": "C",
                    "to": "E",
                    "weight": 5
                  },
                  {
                    "from": "D",
                    "to": "F",
                    "weight": 2
                  },
                  {
                    "from": "E",
                    "to": "F",
                    "weight": 5
                  }
                ]
              },
              "heuristic": {
                "A": 6,
                "B": 4,
                "C": 7,
                "D": 2,
                "E": 4,
                "F": 0
              }
            },
            "state": {
              "operation": "keep",
              "from": "B",
              "to": "A",
              "candidate": 4,
              "distances": {
                "A": 0,
                "B": 2,
                "C": 1,
                "D": null,
                "E": null,
                "F": null
              },
              "predecessors": {
                "B": "A",
                "C": "A"
              },
              "frontier": [
                "C"
              ],
              "selected": [
                "A",
                "B"
              ]
            },
            "highlights": [
              {
                "from": "B",
                "to": "A"
              }
            ]
          }
        },
        {
          "id": "7-relax-B-D",
          "caption": "Bを経由するとDへのコストが4になるので、距離と前の場所を更新します。",
          "canvas": {
            "data": {
              "mode": "astar",
              "graph": {
                "nodes": [
                  {
                    "id": "A",
                    "x": 0,
                    "y": 0
                  },
                  {
                    "id": "B",
                    "x": 2,
                    "y": 0
                  },
                  {
                    "id": "C",
                    "x": 0,
                    "y": 1
                  },
                  {
                    "id": "D",
                    "x": 4,
                    "y": 0
                  },
                  {
                    "id": "E",
                    "x": 3,
                    "y": 1
                  },
                  {
                    "id": "F",
                    "x": 6,
                    "y": 0
                  }
                ],
                "edges": [
                  {
                    "from": "A",
                    "to": "B",
                    "weight": 2
                  },
                  {
                    "from": "A",
                    "to": "C",
                    "weight": 1
                  },
                  {
                    "from": "B",
                    "to": "D",
                    "weight": 2
                  },
                  {
                    "from": "B",
                    "to": "E",
                    "weight": 2
                  },
                  {
                    "from": "C",
                    "to": "E",
                    "weight": 5
                  },
                  {
                    "from": "D",
                    "to": "F",
                    "weight": 2
                  },
                  {
                    "from": "E",
                    "to": "F",
                    "weight": 5
                  }
                ]
              },
              "heuristic": {
                "A": 6,
                "B": 4,
                "C": 7,
                "D": 2,
                "E": 4,
                "F": 0
              }
            },
            "state": {
              "operation": "relax",
              "from": "B",
              "to": "D",
              "candidate": 4,
              "distances": {
                "A": 0,
                "B": 2,
                "C": 1,
                "D": 4,
                "E": null,
                "F": null
              },
              "predecessors": {
                "B": "A",
                "C": "A",
                "D": "B"
              },
              "frontier": [
                "D",
                "C"
              ],
              "selected": [
                "A",
                "B"
              ]
            },
            "highlights": [
              {
                "from": "B",
                "to": "D"
              }
            ]
          }
        },
        {
          "id": "8-relax-B-E",
          "caption": "Bを経由するとEへのコストが4になるので、距離と前の場所を更新します。",
          "canvas": {
            "data": {
              "mode": "astar",
              "graph": {
                "nodes": [
                  {
                    "id": "A",
                    "x": 0,
                    "y": 0
                  },
                  {
                    "id": "B",
                    "x": 2,
                    "y": 0
                  },
                  {
                    "id": "C",
                    "x": 0,
                    "y": 1
                  },
                  {
                    "id": "D",
                    "x": 4,
                    "y": 0
                  },
                  {
                    "id": "E",
                    "x": 3,
                    "y": 1
                  },
                  {
                    "id": "F",
                    "x": 6,
                    "y": 0
                  }
                ],
                "edges": [
                  {
                    "from": "A",
                    "to": "B",
                    "weight": 2
                  },
                  {
                    "from": "A",
                    "to": "C",
                    "weight": 1
                  },
                  {
                    "from": "B",
                    "to": "D",
                    "weight": 2
                  },
                  {
                    "from": "B",
                    "to": "E",
                    "weight": 2
                  },
                  {
                    "from": "C",
                    "to": "E",
                    "weight": 5
                  },
                  {
                    "from": "D",
                    "to": "F",
                    "weight": 2
                  },
                  {
                    "from": "E",
                    "to": "F",
                    "weight": 5
                  }
                ]
              },
              "heuristic": {
                "A": 6,
                "B": 4,
                "C": 7,
                "D": 2,
                "E": 4,
                "F": 0
              }
            },
            "state": {
              "operation": "relax",
              "from": "B",
              "to": "E",
              "candidate": 4,
              "distances": {
                "A": 0,
                "B": 2,
                "C": 1,
                "D": 4,
                "E": 4,
                "F": null
              },
              "predecessors": {
                "B": "A",
                "C": "A",
                "D": "B",
                "E": "B"
              },
              "frontier": [
                "D",
                "C",
                "E"
              ],
              "selected": [
                "A",
                "B"
              ]
            },
            "highlights": [
              {
                "from": "B",
                "to": "E"
              }
            ]
          }
        },
        {
          "id": "9-select-D-none",
          "caption": "候補の中で移動コストと残りの推定コストの合計が最小のD（6）を選びます。",
          "canvas": {
            "data": {
              "mode": "astar",
              "graph": {
                "nodes": [
                  {
                    "id": "A",
                    "x": 0,
                    "y": 0
                  },
                  {
                    "id": "B",
                    "x": 2,
                    "y": 0
                  },
                  {
                    "id": "C",
                    "x": 0,
                    "y": 1
                  },
                  {
                    "id": "D",
                    "x": 4,
                    "y": 0
                  },
                  {
                    "id": "E",
                    "x": 3,
                    "y": 1
                  },
                  {
                    "id": "F",
                    "x": 6,
                    "y": 0
                  }
                ],
                "edges": [
                  {
                    "from": "A",
                    "to": "B",
                    "weight": 2
                  },
                  {
                    "from": "A",
                    "to": "C",
                    "weight": 1
                  },
                  {
                    "from": "B",
                    "to": "D",
                    "weight": 2
                  },
                  {
                    "from": "B",
                    "to": "E",
                    "weight": 2
                  },
                  {
                    "from": "C",
                    "to": "E",
                    "weight": 5
                  },
                  {
                    "from": "D",
                    "to": "F",
                    "weight": 2
                  },
                  {
                    "from": "E",
                    "to": "F",
                    "weight": 5
                  }
                ]
              },
              "heuristic": {
                "A": 6,
                "B": 4,
                "C": 7,
                "D": 2,
                "E": 4,
                "F": 0
              }
            },
            "state": {
              "operation": "select",
              "from": "D",
              "to": null,
              "candidate": null,
              "distances": {
                "A": 0,
                "B": 2,
                "C": 1,
                "D": 4,
                "E": 4,
                "F": null
              },
              "predecessors": {
                "B": "A",
                "C": "A",
                "D": "B",
                "E": "B"
              },
              "frontier": [
                "C",
                "E"
              ],
              "selected": [
                "A",
                "B",
                "D"
              ]
            },
            "highlights": []
          }
        },
        {
          "id": "10-keep-D-B",
          "caption": "Dを経由するとBへのコストは6となり、記録済みのコスト2より小さくないので更新しません。",
          "canvas": {
            "data": {
              "mode": "astar",
              "graph": {
                "nodes": [
                  {
                    "id": "A",
                    "x": 0,
                    "y": 0
                  },
                  {
                    "id": "B",
                    "x": 2,
                    "y": 0
                  },
                  {
                    "id": "C",
                    "x": 0,
                    "y": 1
                  },
                  {
                    "id": "D",
                    "x": 4,
                    "y": 0
                  },
                  {
                    "id": "E",
                    "x": 3,
                    "y": 1
                  },
                  {
                    "id": "F",
                    "x": 6,
                    "y": 0
                  }
                ],
                "edges": [
                  {
                    "from": "A",
                    "to": "B",
                    "weight": 2
                  },
                  {
                    "from": "A",
                    "to": "C",
                    "weight": 1
                  },
                  {
                    "from": "B",
                    "to": "D",
                    "weight": 2
                  },
                  {
                    "from": "B",
                    "to": "E",
                    "weight": 2
                  },
                  {
                    "from": "C",
                    "to": "E",
                    "weight": 5
                  },
                  {
                    "from": "D",
                    "to": "F",
                    "weight": 2
                  },
                  {
                    "from": "E",
                    "to": "F",
                    "weight": 5
                  }
                ]
              },
              "heuristic": {
                "A": 6,
                "B": 4,
                "C": 7,
                "D": 2,
                "E": 4,
                "F": 0
              }
            },
            "state": {
              "operation": "keep",
              "from": "D",
              "to": "B",
              "candidate": 6,
              "distances": {
                "A": 0,
                "B": 2,
                "C": 1,
                "D": 4,
                "E": 4,
                "F": null
              },
              "predecessors": {
                "B": "A",
                "C": "A",
                "D": "B",
                "E": "B"
              },
              "frontier": [
                "C",
                "E"
              ],
              "selected": [
                "A",
                "B",
                "D"
              ]
            },
            "highlights": [
              {
                "from": "D",
                "to": "B"
              }
            ]
          }
        },
        {
          "id": "11-relax-D-F",
          "caption": "Dを経由するとFへのコストが6になるので、距離と前の場所を更新します。",
          "canvas": {
            "data": {
              "mode": "astar",
              "graph": {
                "nodes": [
                  {
                    "id": "A",
                    "x": 0,
                    "y": 0
                  },
                  {
                    "id": "B",
                    "x": 2,
                    "y": 0
                  },
                  {
                    "id": "C",
                    "x": 0,
                    "y": 1
                  },
                  {
                    "id": "D",
                    "x": 4,
                    "y": 0
                  },
                  {
                    "id": "E",
                    "x": 3,
                    "y": 1
                  },
                  {
                    "id": "F",
                    "x": 6,
                    "y": 0
                  }
                ],
                "edges": [
                  {
                    "from": "A",
                    "to": "B",
                    "weight": 2
                  },
                  {
                    "from": "A",
                    "to": "C",
                    "weight": 1
                  },
                  {
                    "from": "B",
                    "to": "D",
                    "weight": 2
                  },
                  {
                    "from": "B",
                    "to": "E",
                    "weight": 2
                  },
                  {
                    "from": "C",
                    "to": "E",
                    "weight": 5
                  },
                  {
                    "from": "D",
                    "to": "F",
                    "weight": 2
                  },
                  {
                    "from": "E",
                    "to": "F",
                    "weight": 5
                  }
                ]
              },
              "heuristic": {
                "A": 6,
                "B": 4,
                "C": 7,
                "D": 2,
                "E": 4,
                "F": 0
              }
            },
            "state": {
              "operation": "relax",
              "from": "D",
              "to": "F",
              "candidate": 6,
              "distances": {
                "A": 0,
                "B": 2,
                "C": 1,
                "D": 4,
                "E": 4,
                "F": 6
              },
              "predecessors": {
                "B": "A",
                "C": "A",
                "D": "B",
                "E": "B",
                "F": "D"
              },
              "frontier": [
                "F",
                "C",
                "E"
              ],
              "selected": [
                "A",
                "B",
                "D"
              ]
            },
            "highlights": [
              {
                "from": "D",
                "to": "F"
              }
            ]
          }
        },
        {
          "id": "12-select-F-none",
          "caption": "候補の中で移動コストと残りの推定コストの合計が最小のF（6）を選びます。",
          "canvas": {
            "data": {
              "mode": "astar",
              "graph": {
                "nodes": [
                  {
                    "id": "A",
                    "x": 0,
                    "y": 0
                  },
                  {
                    "id": "B",
                    "x": 2,
                    "y": 0
                  },
                  {
                    "id": "C",
                    "x": 0,
                    "y": 1
                  },
                  {
                    "id": "D",
                    "x": 4,
                    "y": 0
                  },
                  {
                    "id": "E",
                    "x": 3,
                    "y": 1
                  },
                  {
                    "id": "F",
                    "x": 6,
                    "y": 0
                  }
                ],
                "edges": [
                  {
                    "from": "A",
                    "to": "B",
                    "weight": 2
                  },
                  {
                    "from": "A",
                    "to": "C",
                    "weight": 1
                  },
                  {
                    "from": "B",
                    "to": "D",
                    "weight": 2
                  },
                  {
                    "from": "B",
                    "to": "E",
                    "weight": 2
                  },
                  {
                    "from": "C",
                    "to": "E",
                    "weight": 5
                  },
                  {
                    "from": "D",
                    "to": "F",
                    "weight": 2
                  },
                  {
                    "from": "E",
                    "to": "F",
                    "weight": 5
                  }
                ]
              },
              "heuristic": {
                "A": 6,
                "B": 4,
                "C": 7,
                "D": 2,
                "E": 4,
                "F": 0
              }
            },
            "state": {
              "operation": "select",
              "from": "F",
              "to": null,
              "candidate": null,
              "distances": {
                "A": 0,
                "B": 2,
                "C": 1,
                "D": 4,
                "E": 4,
                "F": 6
              },
              "predecessors": {
                "B": "A",
                "C": "A",
                "D": "B",
                "E": "B",
                "F": "D"
              },
              "frontier": [
                "C",
                "E"
              ],
              "selected": [
                "A",
                "B",
                "D",
                "F"
              ]
            },
            "highlights": []
          }
        },
        {
          "id": "13-finish-F-none",
          "caption": "ゴールFから前の場所をたどると、最短経路A→B→D→F（コスト6）が分かります。",
          "canvas": {
            "data": {
              "mode": "astar",
              "graph": {
                "nodes": [
                  {
                    "id": "A",
                    "x": 0,
                    "y": 0
                  },
                  {
                    "id": "B",
                    "x": 2,
                    "y": 0
                  },
                  {
                    "id": "C",
                    "x": 0,
                    "y": 1
                  },
                  {
                    "id": "D",
                    "x": 4,
                    "y": 0
                  },
                  {
                    "id": "E",
                    "x": 3,
                    "y": 1
                  },
                  {
                    "id": "F",
                    "x": 6,
                    "y": 0
                  }
                ],
                "edges": [
                  {
                    "from": "A",
                    "to": "B",
                    "weight": 2
                  },
                  {
                    "from": "A",
                    "to": "C",
                    "weight": 1
                  },
                  {
                    "from": "B",
                    "to": "D",
                    "weight": 2
                  },
                  {
                    "from": "B",
                    "to": "E",
                    "weight": 2
                  },
                  {
                    "from": "C",
                    "to": "E",
                    "weight": 5
                  },
                  {
                    "from": "D",
                    "to": "F",
                    "weight": 2
                  },
                  {
                    "from": "E",
                    "to": "F",
                    "weight": 5
                  }
                ]
              },
              "heuristic": {
                "A": 6,
                "B": 4,
                "C": 7,
                "D": 2,
                "E": 4,
                "F": 0
              }
            },
            "state": {
              "operation": "finish",
              "from": "F",
              "to": null,
              "candidate": null,
              "distances": {
                "A": 0,
                "B": 2,
                "C": 1,
                "D": 4,
                "E": 4,
                "F": 6
              },
              "predecessors": {
                "B": "A",
                "C": "A",
                "D": "B",
                "E": "B",
                "F": "D"
              },
              "frontier": [
                "C",
                "E"
              ],
              "selected": [
                "A",
                "B",
                "D",
                "F"
              ]
            },
            "highlights": []
          }
        }
      ]
    },
    "mapping": {
      "version": 1,
      "kind": "step-sequence",
      "id": "astar-code-mapping",
      "phase": 4,
      "intervalMs": 3500,
      "code": {
        "id": "astar-v1",
        "version": 1,
        "language": "python",
        "lines": [
          {
            "id": "define-function",
            "text": "def astar(graph, start, goal, h):"
          },
          {
            "id": "init-distance",
            "text": "    g = {start: 0}"
          },
          {
            "id": "init-parent",
            "text": "    parent = {}"
          },
          {
            "id": "init-frontier",
            "text": "    frontier = {start}"
          },
          {
            "id": "while-frontier",
            "text": "    while frontier:"
          },
          {
            "id": "select-min",
            "text": "        u = min(frontier, key=lambda n: (g[n] + h[n], n))"
          },
          {
            "id": "remove",
            "text": "        frontier.remove(u)"
          },
          {
            "id": "goal-check",
            "text": "        if u == goal:"
          },
          {
            "id": "path-start",
            "text": "            path = [u]"
          },
          {
            "id": "path-loop",
            "text": "            while path[0] != start:"
          },
          {
            "id": "reconstruct",
            "text": "                path.insert(0, parent[path[0]])"
          },
          {
            "id": "return-path",
            "text": "            return (g[u], path)"
          },
          {
            "id": "for-neighbor",
            "text": "        for v, w in graph[u]:"
          },
          {
            "id": "candidate",
            "text": "            candidate = g[u] + w"
          },
          {
            "id": "relax-condition",
            "text": "            if candidate < g.get(v, float('inf')):"
          },
          {
            "id": "update-distance",
            "text": "                g[v] = candidate"
          },
          {
            "id": "update-parent",
            "text": "                parent[v] = u"
          },
          {
            "id": "add-frontier",
            "text": "                frontier.add(v)"
          },
          {
            "id": "unreachable",
            "text": "    return (None, [])"
          }
        ]
      },
      "steps": [
        {
          "id": "1-init-start-none",
          "caption": "出発点Aまでの移動コストを0として、候補に追加します。",
          "canvas": {
            "data": {
              "mode": "astar",
              "graph": {
                "nodes": [
                  {
                    "id": "A",
                    "x": 0,
                    "y": 0
                  },
                  {
                    "id": "B",
                    "x": 2,
                    "y": 0
                  },
                  {
                    "id": "C",
                    "x": 0,
                    "y": 1
                  },
                  {
                    "id": "D",
                    "x": 4,
                    "y": 0
                  },
                  {
                    "id": "E",
                    "x": 3,
                    "y": 1
                  },
                  {
                    "id": "F",
                    "x": 6,
                    "y": 0
                  }
                ],
                "edges": [
                  {
                    "from": "A",
                    "to": "B",
                    "weight": 2
                  },
                  {
                    "from": "A",
                    "to": "C",
                    "weight": 1
                  },
                  {
                    "from": "B",
                    "to": "D",
                    "weight": 2
                  },
                  {
                    "from": "B",
                    "to": "E",
                    "weight": 2
                  },
                  {
                    "from": "C",
                    "to": "E",
                    "weight": 5
                  },
                  {
                    "from": "D",
                    "to": "F",
                    "weight": 2
                  },
                  {
                    "from": "E",
                    "to": "F",
                    "weight": 5
                  }
                ]
              },
              "heuristic": {
                "A": 6,
                "B": 4,
                "C": 7,
                "D": 2,
                "E": 4,
                "F": 0
              }
            },
            "state": {
              "operation": "init",
              "from": null,
              "to": null,
              "candidate": null,
              "distances": {
                "A": 0,
                "B": null,
                "C": null,
                "D": null,
                "E": null,
                "F": null
              },
              "predecessors": {},
              "frontier": [
                "A"
              ],
              "selected": []
            },
            "highlights": []
          },
          "codeFocus": [
            "init-distance",
            "init-parent",
            "init-frontier"
          ]
        },
        {
          "id": "2-select-A-none",
          "caption": "候補の中で移動コストと残りの推定コストの合計が最小のA（6）を選びます。",
          "canvas": {
            "data": {
              "mode": "astar",
              "graph": {
                "nodes": [
                  {
                    "id": "A",
                    "x": 0,
                    "y": 0
                  },
                  {
                    "id": "B",
                    "x": 2,
                    "y": 0
                  },
                  {
                    "id": "C",
                    "x": 0,
                    "y": 1
                  },
                  {
                    "id": "D",
                    "x": 4,
                    "y": 0
                  },
                  {
                    "id": "E",
                    "x": 3,
                    "y": 1
                  },
                  {
                    "id": "F",
                    "x": 6,
                    "y": 0
                  }
                ],
                "edges": [
                  {
                    "from": "A",
                    "to": "B",
                    "weight": 2
                  },
                  {
                    "from": "A",
                    "to": "C",
                    "weight": 1
                  },
                  {
                    "from": "B",
                    "to": "D",
                    "weight": 2
                  },
                  {
                    "from": "B",
                    "to": "E",
                    "weight": 2
                  },
                  {
                    "from": "C",
                    "to": "E",
                    "weight": 5
                  },
                  {
                    "from": "D",
                    "to": "F",
                    "weight": 2
                  },
                  {
                    "from": "E",
                    "to": "F",
                    "weight": 5
                  }
                ]
              },
              "heuristic": {
                "A": 6,
                "B": 4,
                "C": 7,
                "D": 2,
                "E": 4,
                "F": 0
              }
            },
            "state": {
              "operation": "select",
              "from": "A",
              "to": null,
              "candidate": null,
              "distances": {
                "A": 0,
                "B": null,
                "C": null,
                "D": null,
                "E": null,
                "F": null
              },
              "predecessors": {},
              "frontier": [],
              "selected": [
                "A"
              ]
            },
            "highlights": []
          },
          "codeFocus": [
            "while-frontier",
            "select-min",
            "remove"
          ]
        },
        {
          "id": "3-relax-A-B",
          "caption": "Aを経由するとBへのコストが2になるので、距離と前の場所を更新します。",
          "canvas": {
            "data": {
              "mode": "astar",
              "graph": {
                "nodes": [
                  {
                    "id": "A",
                    "x": 0,
                    "y": 0
                  },
                  {
                    "id": "B",
                    "x": 2,
                    "y": 0
                  },
                  {
                    "id": "C",
                    "x": 0,
                    "y": 1
                  },
                  {
                    "id": "D",
                    "x": 4,
                    "y": 0
                  },
                  {
                    "id": "E",
                    "x": 3,
                    "y": 1
                  },
                  {
                    "id": "F",
                    "x": 6,
                    "y": 0
                  }
                ],
                "edges": [
                  {
                    "from": "A",
                    "to": "B",
                    "weight": 2
                  },
                  {
                    "from": "A",
                    "to": "C",
                    "weight": 1
                  },
                  {
                    "from": "B",
                    "to": "D",
                    "weight": 2
                  },
                  {
                    "from": "B",
                    "to": "E",
                    "weight": 2
                  },
                  {
                    "from": "C",
                    "to": "E",
                    "weight": 5
                  },
                  {
                    "from": "D",
                    "to": "F",
                    "weight": 2
                  },
                  {
                    "from": "E",
                    "to": "F",
                    "weight": 5
                  }
                ]
              },
              "heuristic": {
                "A": 6,
                "B": 4,
                "C": 7,
                "D": 2,
                "E": 4,
                "F": 0
              }
            },
            "state": {
              "operation": "relax",
              "from": "A",
              "to": "B",
              "candidate": 2,
              "distances": {
                "A": 0,
                "B": 2,
                "C": null,
                "D": null,
                "E": null,
                "F": null
              },
              "predecessors": {
                "B": "A"
              },
              "frontier": [
                "B"
              ],
              "selected": [
                "A"
              ]
            },
            "highlights": [
              {
                "from": "A",
                "to": "B"
              }
            ]
          },
          "codeFocus": [
            "for-neighbor",
            "candidate",
            "relax-condition",
            "update-distance",
            "update-parent",
            "add-frontier"
          ]
        },
        {
          "id": "4-relax-A-C",
          "caption": "Aを経由するとCへのコストが1になるので、距離と前の場所を更新します。",
          "canvas": {
            "data": {
              "mode": "astar",
              "graph": {
                "nodes": [
                  {
                    "id": "A",
                    "x": 0,
                    "y": 0
                  },
                  {
                    "id": "B",
                    "x": 2,
                    "y": 0
                  },
                  {
                    "id": "C",
                    "x": 0,
                    "y": 1
                  },
                  {
                    "id": "D",
                    "x": 4,
                    "y": 0
                  },
                  {
                    "id": "E",
                    "x": 3,
                    "y": 1
                  },
                  {
                    "id": "F",
                    "x": 6,
                    "y": 0
                  }
                ],
                "edges": [
                  {
                    "from": "A",
                    "to": "B",
                    "weight": 2
                  },
                  {
                    "from": "A",
                    "to": "C",
                    "weight": 1
                  },
                  {
                    "from": "B",
                    "to": "D",
                    "weight": 2
                  },
                  {
                    "from": "B",
                    "to": "E",
                    "weight": 2
                  },
                  {
                    "from": "C",
                    "to": "E",
                    "weight": 5
                  },
                  {
                    "from": "D",
                    "to": "F",
                    "weight": 2
                  },
                  {
                    "from": "E",
                    "to": "F",
                    "weight": 5
                  }
                ]
              },
              "heuristic": {
                "A": 6,
                "B": 4,
                "C": 7,
                "D": 2,
                "E": 4,
                "F": 0
              }
            },
            "state": {
              "operation": "relax",
              "from": "A",
              "to": "C",
              "candidate": 1,
              "distances": {
                "A": 0,
                "B": 2,
                "C": 1,
                "D": null,
                "E": null,
                "F": null
              },
              "predecessors": {
                "B": "A",
                "C": "A"
              },
              "frontier": [
                "B",
                "C"
              ],
              "selected": [
                "A"
              ]
            },
            "highlights": [
              {
                "from": "A",
                "to": "C"
              }
            ]
          },
          "codeFocus": [
            "for-neighbor",
            "candidate",
            "relax-condition",
            "update-distance",
            "update-parent",
            "add-frontier"
          ]
        },
        {
          "id": "5-select-B-none",
          "caption": "候補の中で移動コストと残りの推定コストの合計が最小のB（6）を選びます。",
          "canvas": {
            "data": {
              "mode": "astar",
              "graph": {
                "nodes": [
                  {
                    "id": "A",
                    "x": 0,
                    "y": 0
                  },
                  {
                    "id": "B",
                    "x": 2,
                    "y": 0
                  },
                  {
                    "id": "C",
                    "x": 0,
                    "y": 1
                  },
                  {
                    "id": "D",
                    "x": 4,
                    "y": 0
                  },
                  {
                    "id": "E",
                    "x": 3,
                    "y": 1
                  },
                  {
                    "id": "F",
                    "x": 6,
                    "y": 0
                  }
                ],
                "edges": [
                  {
                    "from": "A",
                    "to": "B",
                    "weight": 2
                  },
                  {
                    "from": "A",
                    "to": "C",
                    "weight": 1
                  },
                  {
                    "from": "B",
                    "to": "D",
                    "weight": 2
                  },
                  {
                    "from": "B",
                    "to": "E",
                    "weight": 2
                  },
                  {
                    "from": "C",
                    "to": "E",
                    "weight": 5
                  },
                  {
                    "from": "D",
                    "to": "F",
                    "weight": 2
                  },
                  {
                    "from": "E",
                    "to": "F",
                    "weight": 5
                  }
                ]
              },
              "heuristic": {
                "A": 6,
                "B": 4,
                "C": 7,
                "D": 2,
                "E": 4,
                "F": 0
              }
            },
            "state": {
              "operation": "select",
              "from": "B",
              "to": null,
              "candidate": null,
              "distances": {
                "A": 0,
                "B": 2,
                "C": 1,
                "D": null,
                "E": null,
                "F": null
              },
              "predecessors": {
                "B": "A",
                "C": "A"
              },
              "frontier": [
                "C"
              ],
              "selected": [
                "A",
                "B"
              ]
            },
            "highlights": []
          },
          "codeFocus": [
            "while-frontier",
            "select-min",
            "remove"
          ]
        },
        {
          "id": "6-keep-B-A",
          "caption": "Bを経由するとAへのコストは4となり、記録済みのコスト0より小さくないので更新しません。",
          "canvas": {
            "data": {
              "mode": "astar",
              "graph": {
                "nodes": [
                  {
                    "id": "A",
                    "x": 0,
                    "y": 0
                  },
                  {
                    "id": "B",
                    "x": 2,
                    "y": 0
                  },
                  {
                    "id": "C",
                    "x": 0,
                    "y": 1
                  },
                  {
                    "id": "D",
                    "x": 4,
                    "y": 0
                  },
                  {
                    "id": "E",
                    "x": 3,
                    "y": 1
                  },
                  {
                    "id": "F",
                    "x": 6,
                    "y": 0
                  }
                ],
                "edges": [
                  {
                    "from": "A",
                    "to": "B",
                    "weight": 2
                  },
                  {
                    "from": "A",
                    "to": "C",
                    "weight": 1
                  },
                  {
                    "from": "B",
                    "to": "D",
                    "weight": 2
                  },
                  {
                    "from": "B",
                    "to": "E",
                    "weight": 2
                  },
                  {
                    "from": "C",
                    "to": "E",
                    "weight": 5
                  },
                  {
                    "from": "D",
                    "to": "F",
                    "weight": 2
                  },
                  {
                    "from": "E",
                    "to": "F",
                    "weight": 5
                  }
                ]
              },
              "heuristic": {
                "A": 6,
                "B": 4,
                "C": 7,
                "D": 2,
                "E": 4,
                "F": 0
              }
            },
            "state": {
              "operation": "keep",
              "from": "B",
              "to": "A",
              "candidate": 4,
              "distances": {
                "A": 0,
                "B": 2,
                "C": 1,
                "D": null,
                "E": null,
                "F": null
              },
              "predecessors": {
                "B": "A",
                "C": "A"
              },
              "frontier": [
                "C"
              ],
              "selected": [
                "A",
                "B"
              ]
            },
            "highlights": [
              {
                "from": "B",
                "to": "A"
              }
            ]
          },
          "codeFocus": [
            "for-neighbor",
            "candidate",
            "relax-condition"
          ]
        },
        {
          "id": "7-relax-B-D",
          "caption": "Bを経由するとDへのコストが4になるので、距離と前の場所を更新します。",
          "canvas": {
            "data": {
              "mode": "astar",
              "graph": {
                "nodes": [
                  {
                    "id": "A",
                    "x": 0,
                    "y": 0
                  },
                  {
                    "id": "B",
                    "x": 2,
                    "y": 0
                  },
                  {
                    "id": "C",
                    "x": 0,
                    "y": 1
                  },
                  {
                    "id": "D",
                    "x": 4,
                    "y": 0
                  },
                  {
                    "id": "E",
                    "x": 3,
                    "y": 1
                  },
                  {
                    "id": "F",
                    "x": 6,
                    "y": 0
                  }
                ],
                "edges": [
                  {
                    "from": "A",
                    "to": "B",
                    "weight": 2
                  },
                  {
                    "from": "A",
                    "to": "C",
                    "weight": 1
                  },
                  {
                    "from": "B",
                    "to": "D",
                    "weight": 2
                  },
                  {
                    "from": "B",
                    "to": "E",
                    "weight": 2
                  },
                  {
                    "from": "C",
                    "to": "E",
                    "weight": 5
                  },
                  {
                    "from": "D",
                    "to": "F",
                    "weight": 2
                  },
                  {
                    "from": "E",
                    "to": "F",
                    "weight": 5
                  }
                ]
              },
              "heuristic": {
                "A": 6,
                "B": 4,
                "C": 7,
                "D": 2,
                "E": 4,
                "F": 0
              }
            },
            "state": {
              "operation": "relax",
              "from": "B",
              "to": "D",
              "candidate": 4,
              "distances": {
                "A": 0,
                "B": 2,
                "C": 1,
                "D": 4,
                "E": null,
                "F": null
              },
              "predecessors": {
                "B": "A",
                "C": "A",
                "D": "B"
              },
              "frontier": [
                "D",
                "C"
              ],
              "selected": [
                "A",
                "B"
              ]
            },
            "highlights": [
              {
                "from": "B",
                "to": "D"
              }
            ]
          },
          "codeFocus": [
            "for-neighbor",
            "candidate",
            "relax-condition",
            "update-distance",
            "update-parent",
            "add-frontier"
          ]
        },
        {
          "id": "8-relax-B-E",
          "caption": "Bを経由するとEへのコストが4になるので、距離と前の場所を更新します。",
          "canvas": {
            "data": {
              "mode": "astar",
              "graph": {
                "nodes": [
                  {
                    "id": "A",
                    "x": 0,
                    "y": 0
                  },
                  {
                    "id": "B",
                    "x": 2,
                    "y": 0
                  },
                  {
                    "id": "C",
                    "x": 0,
                    "y": 1
                  },
                  {
                    "id": "D",
                    "x": 4,
                    "y": 0
                  },
                  {
                    "id": "E",
                    "x": 3,
                    "y": 1
                  },
                  {
                    "id": "F",
                    "x": 6,
                    "y": 0
                  }
                ],
                "edges": [
                  {
                    "from": "A",
                    "to": "B",
                    "weight": 2
                  },
                  {
                    "from": "A",
                    "to": "C",
                    "weight": 1
                  },
                  {
                    "from": "B",
                    "to": "D",
                    "weight": 2
                  },
                  {
                    "from": "B",
                    "to": "E",
                    "weight": 2
                  },
                  {
                    "from": "C",
                    "to": "E",
                    "weight": 5
                  },
                  {
                    "from": "D",
                    "to": "F",
                    "weight": 2
                  },
                  {
                    "from": "E",
                    "to": "F",
                    "weight": 5
                  }
                ]
              },
              "heuristic": {
                "A": 6,
                "B": 4,
                "C": 7,
                "D": 2,
                "E": 4,
                "F": 0
              }
            },
            "state": {
              "operation": "relax",
              "from": "B",
              "to": "E",
              "candidate": 4,
              "distances": {
                "A": 0,
                "B": 2,
                "C": 1,
                "D": 4,
                "E": 4,
                "F": null
              },
              "predecessors": {
                "B": "A",
                "C": "A",
                "D": "B",
                "E": "B"
              },
              "frontier": [
                "D",
                "C",
                "E"
              ],
              "selected": [
                "A",
                "B"
              ]
            },
            "highlights": [
              {
                "from": "B",
                "to": "E"
              }
            ]
          },
          "codeFocus": [
            "for-neighbor",
            "candidate",
            "relax-condition",
            "update-distance",
            "update-parent",
            "add-frontier"
          ]
        },
        {
          "id": "9-select-D-none",
          "caption": "候補の中で移動コストと残りの推定コストの合計が最小のD（6）を選びます。",
          "canvas": {
            "data": {
              "mode": "astar",
              "graph": {
                "nodes": [
                  {
                    "id": "A",
                    "x": 0,
                    "y": 0
                  },
                  {
                    "id": "B",
                    "x": 2,
                    "y": 0
                  },
                  {
                    "id": "C",
                    "x": 0,
                    "y": 1
                  },
                  {
                    "id": "D",
                    "x": 4,
                    "y": 0
                  },
                  {
                    "id": "E",
                    "x": 3,
                    "y": 1
                  },
                  {
                    "id": "F",
                    "x": 6,
                    "y": 0
                  }
                ],
                "edges": [
                  {
                    "from": "A",
                    "to": "B",
                    "weight": 2
                  },
                  {
                    "from": "A",
                    "to": "C",
                    "weight": 1
                  },
                  {
                    "from": "B",
                    "to": "D",
                    "weight": 2
                  },
                  {
                    "from": "B",
                    "to": "E",
                    "weight": 2
                  },
                  {
                    "from": "C",
                    "to": "E",
                    "weight": 5
                  },
                  {
                    "from": "D",
                    "to": "F",
                    "weight": 2
                  },
                  {
                    "from": "E",
                    "to": "F",
                    "weight": 5
                  }
                ]
              },
              "heuristic": {
                "A": 6,
                "B": 4,
                "C": 7,
                "D": 2,
                "E": 4,
                "F": 0
              }
            },
            "state": {
              "operation": "select",
              "from": "D",
              "to": null,
              "candidate": null,
              "distances": {
                "A": 0,
                "B": 2,
                "C": 1,
                "D": 4,
                "E": 4,
                "F": null
              },
              "predecessors": {
                "B": "A",
                "C": "A",
                "D": "B",
                "E": "B"
              },
              "frontier": [
                "C",
                "E"
              ],
              "selected": [
                "A",
                "B",
                "D"
              ]
            },
            "highlights": []
          },
          "codeFocus": [
            "while-frontier",
            "select-min",
            "remove"
          ]
        },
        {
          "id": "10-keep-D-B",
          "caption": "Dを経由するとBへのコストは6となり、記録済みのコスト2より小さくないので更新しません。",
          "canvas": {
            "data": {
              "mode": "astar",
              "graph": {
                "nodes": [
                  {
                    "id": "A",
                    "x": 0,
                    "y": 0
                  },
                  {
                    "id": "B",
                    "x": 2,
                    "y": 0
                  },
                  {
                    "id": "C",
                    "x": 0,
                    "y": 1
                  },
                  {
                    "id": "D",
                    "x": 4,
                    "y": 0
                  },
                  {
                    "id": "E",
                    "x": 3,
                    "y": 1
                  },
                  {
                    "id": "F",
                    "x": 6,
                    "y": 0
                  }
                ],
                "edges": [
                  {
                    "from": "A",
                    "to": "B",
                    "weight": 2
                  },
                  {
                    "from": "A",
                    "to": "C",
                    "weight": 1
                  },
                  {
                    "from": "B",
                    "to": "D",
                    "weight": 2
                  },
                  {
                    "from": "B",
                    "to": "E",
                    "weight": 2
                  },
                  {
                    "from": "C",
                    "to": "E",
                    "weight": 5
                  },
                  {
                    "from": "D",
                    "to": "F",
                    "weight": 2
                  },
                  {
                    "from": "E",
                    "to": "F",
                    "weight": 5
                  }
                ]
              },
              "heuristic": {
                "A": 6,
                "B": 4,
                "C": 7,
                "D": 2,
                "E": 4,
                "F": 0
              }
            },
            "state": {
              "operation": "keep",
              "from": "D",
              "to": "B",
              "candidate": 6,
              "distances": {
                "A": 0,
                "B": 2,
                "C": 1,
                "D": 4,
                "E": 4,
                "F": null
              },
              "predecessors": {
                "B": "A",
                "C": "A",
                "D": "B",
                "E": "B"
              },
              "frontier": [
                "C",
                "E"
              ],
              "selected": [
                "A",
                "B",
                "D"
              ]
            },
            "highlights": [
              {
                "from": "D",
                "to": "B"
              }
            ]
          },
          "codeFocus": [
            "for-neighbor",
            "candidate",
            "relax-condition"
          ]
        },
        {
          "id": "11-relax-D-F",
          "caption": "Dを経由するとFへのコストが6になるので、距離と前の場所を更新します。",
          "canvas": {
            "data": {
              "mode": "astar",
              "graph": {
                "nodes": [
                  {
                    "id": "A",
                    "x": 0,
                    "y": 0
                  },
                  {
                    "id": "B",
                    "x": 2,
                    "y": 0
                  },
                  {
                    "id": "C",
                    "x": 0,
                    "y": 1
                  },
                  {
                    "id": "D",
                    "x": 4,
                    "y": 0
                  },
                  {
                    "id": "E",
                    "x": 3,
                    "y": 1
                  },
                  {
                    "id": "F",
                    "x": 6,
                    "y": 0
                  }
                ],
                "edges": [
                  {
                    "from": "A",
                    "to": "B",
                    "weight": 2
                  },
                  {
                    "from": "A",
                    "to": "C",
                    "weight": 1
                  },
                  {
                    "from": "B",
                    "to": "D",
                    "weight": 2
                  },
                  {
                    "from": "B",
                    "to": "E",
                    "weight": 2
                  },
                  {
                    "from": "C",
                    "to": "E",
                    "weight": 5
                  },
                  {
                    "from": "D",
                    "to": "F",
                    "weight": 2
                  },
                  {
                    "from": "E",
                    "to": "F",
                    "weight": 5
                  }
                ]
              },
              "heuristic": {
                "A": 6,
                "B": 4,
                "C": 7,
                "D": 2,
                "E": 4,
                "F": 0
              }
            },
            "state": {
              "operation": "relax",
              "from": "D",
              "to": "F",
              "candidate": 6,
              "distances": {
                "A": 0,
                "B": 2,
                "C": 1,
                "D": 4,
                "E": 4,
                "F": 6
              },
              "predecessors": {
                "B": "A",
                "C": "A",
                "D": "B",
                "E": "B",
                "F": "D"
              },
              "frontier": [
                "F",
                "C",
                "E"
              ],
              "selected": [
                "A",
                "B",
                "D"
              ]
            },
            "highlights": [
              {
                "from": "D",
                "to": "F"
              }
            ]
          },
          "codeFocus": [
            "for-neighbor",
            "candidate",
            "relax-condition",
            "update-distance",
            "update-parent",
            "add-frontier"
          ]
        },
        {
          "id": "12-select-F-none",
          "caption": "候補の中で移動コストと残りの推定コストの合計が最小のF（6）を選びます。",
          "canvas": {
            "data": {
              "mode": "astar",
              "graph": {
                "nodes": [
                  {
                    "id": "A",
                    "x": 0,
                    "y": 0
                  },
                  {
                    "id": "B",
                    "x": 2,
                    "y": 0
                  },
                  {
                    "id": "C",
                    "x": 0,
                    "y": 1
                  },
                  {
                    "id": "D",
                    "x": 4,
                    "y": 0
                  },
                  {
                    "id": "E",
                    "x": 3,
                    "y": 1
                  },
                  {
                    "id": "F",
                    "x": 6,
                    "y": 0
                  }
                ],
                "edges": [
                  {
                    "from": "A",
                    "to": "B",
                    "weight": 2
                  },
                  {
                    "from": "A",
                    "to": "C",
                    "weight": 1
                  },
                  {
                    "from": "B",
                    "to": "D",
                    "weight": 2
                  },
                  {
                    "from": "B",
                    "to": "E",
                    "weight": 2
                  },
                  {
                    "from": "C",
                    "to": "E",
                    "weight": 5
                  },
                  {
                    "from": "D",
                    "to": "F",
                    "weight": 2
                  },
                  {
                    "from": "E",
                    "to": "F",
                    "weight": 5
                  }
                ]
              },
              "heuristic": {
                "A": 6,
                "B": 4,
                "C": 7,
                "D": 2,
                "E": 4,
                "F": 0
              }
            },
            "state": {
              "operation": "select",
              "from": "F",
              "to": null,
              "candidate": null,
              "distances": {
                "A": 0,
                "B": 2,
                "C": 1,
                "D": 4,
                "E": 4,
                "F": 6
              },
              "predecessors": {
                "B": "A",
                "C": "A",
                "D": "B",
                "E": "B",
                "F": "D"
              },
              "frontier": [
                "C",
                "E"
              ],
              "selected": [
                "A",
                "B",
                "D",
                "F"
              ]
            },
            "highlights": []
          },
          "codeFocus": [
            "while-frontier",
            "select-min",
            "remove"
          ]
        },
        {
          "id": "13-finish-F-none",
          "caption": "ゴールFから前の場所をたどると、最短経路A→B→D→F（コスト6）が分かります。",
          "canvas": {
            "data": {
              "mode": "astar",
              "graph": {
                "nodes": [
                  {
                    "id": "A",
                    "x": 0,
                    "y": 0
                  },
                  {
                    "id": "B",
                    "x": 2,
                    "y": 0
                  },
                  {
                    "id": "C",
                    "x": 0,
                    "y": 1
                  },
                  {
                    "id": "D",
                    "x": 4,
                    "y": 0
                  },
                  {
                    "id": "E",
                    "x": 3,
                    "y": 1
                  },
                  {
                    "id": "F",
                    "x": 6,
                    "y": 0
                  }
                ],
                "edges": [
                  {
                    "from": "A",
                    "to": "B",
                    "weight": 2
                  },
                  {
                    "from": "A",
                    "to": "C",
                    "weight": 1
                  },
                  {
                    "from": "B",
                    "to": "D",
                    "weight": 2
                  },
                  {
                    "from": "B",
                    "to": "E",
                    "weight": 2
                  },
                  {
                    "from": "C",
                    "to": "E",
                    "weight": 5
                  },
                  {
                    "from": "D",
                    "to": "F",
                    "weight": 2
                  },
                  {
                    "from": "E",
                    "to": "F",
                    "weight": 5
                  }
                ]
              },
              "heuristic": {
                "A": 6,
                "B": 4,
                "C": 7,
                "D": 2,
                "E": 4,
                "F": 0
              }
            },
            "state": {
              "operation": "finish",
              "from": "F",
              "to": null,
              "candidate": null,
              "distances": {
                "A": 0,
                "B": 2,
                "C": 1,
                "D": 4,
                "E": 4,
                "F": 6
              },
              "predecessors": {
                "B": "A",
                "C": "A",
                "D": "B",
                "E": "B",
                "F": "D"
              },
              "frontier": [
                "C",
                "E"
              ],
              "selected": [
                "A",
                "B",
                "D",
                "F"
              ]
            },
            "highlights": []
          },
          "codeFocus": [
            "goal-check",
            "path-start",
            "path-loop",
            "reconstruct",
            "return-path"
          ]
        }
      ]
    },
    "check": {
      "version": 1,
      "kind": "concept-check",
      "id": "astar-check",
      "phase": 3,
      "questions": [
        {
          "id": "next-first",
          "prompt": "次に選ぶ場所をタップしてください。",
          "stepId": "4-relax-A-C",
          "nodeIds": [
            "A",
            "B",
            "C",
            "D",
            "E",
            "F"
          ],
          "allowNone": false,
          "correctAnswer": {
            "kind": "node",
            "nodeId": "B"
          },
          "requires": null,
          "reviewStepIds": [
            "5-select-B-none"
          ],
          "tags": [
            "priority"
          ],
          "correctFeedback": "優先値が最小の候補を選べました。",
          "incorrectFeedback": "候補リストにある値を比べましょう。"
        },
        {
          "kind": "choice",
          "id": "update-first",
          "prompt": "BからDへ進むときのg+hはいくつになりますか？",
          "stepId": "5-select-B-none",
          "choices": [
            {
              "id": "c1",
              "text": "4"
            },
            {
              "id": "c2",
              "text": "6"
            },
            {
              "id": "c3",
              "text": "8"
            }
          ],
          "correctAnswer": {
            "kind": "choice",
            "choiceId": "c2"
          },
          "requires": null,
          "reviewStepIds": [
            "6-keep-B-A"
          ],
          "tags": [
            "priority"
          ],
          "correctFeedback": "その判断で合っています。",
          "incorrectFeedback": "候補の値と更新条件をもう一度確認してみましょう。"
        },
        {
          "id": "next-second",
          "prompt": "隣を調べ終えたあと、次に選ぶ場所はどれですか？",
          "stepId": "8-relax-B-E",
          "nodeIds": [
            "A",
            "B",
            "C",
            "D",
            "E",
            "F"
          ],
          "allowNone": false,
          "correctAnswer": {
            "kind": "node",
            "nodeId": "D"
          },
          "requires": null,
          "reviewStepIds": [
            "9-select-D-none"
          ],
          "tags": [
            "priority"
          ],
          "correctFeedback": "優先値が最小の候補を選べました。",
          "incorrectFeedback": "候補リストにある値を比べましょう。"
        },
        {
          "kind": "choice",
          "id": "update-second",
          "prompt": "DからFへ進むときに記録する移動コストは？",
          "stepId": "9-select-D-none",
          "choices": [
            {
              "id": "c1",
              "text": "4"
            },
            {
              "id": "c2",
              "text": "6"
            },
            {
              "id": "c3",
              "text": "9"
            }
          ],
          "correctAnswer": {
            "kind": "choice",
            "choiceId": "c2"
          },
          "requires": null,
          "reviewStepIds": [
            "10-keep-D-B"
          ],
          "tags": [
            "relaxation"
          ],
          "correctFeedback": "その判断で合っています。",
          "incorrectFeedback": "候補の値と更新条件をもう一度確認してみましょう。"
        }
      ]
    },
    "codeCheck": {
      "version": 1,
      "kind": "code-blank-check",
      "id": "astar-code-check",
      "phase": 5,
      "code": {
        "id": "astar-v1",
        "version": 1,
        "language": "python",
        "lines": [
          {
            "id": "define-function",
            "text": "def astar(graph, start, goal, h):"
          },
          {
            "id": "init-distance",
            "text": "    g = {start: 0}"
          },
          {
            "id": "init-parent",
            "text": "    parent = {}"
          },
          {
            "id": "init-frontier",
            "text": "    frontier = {start}"
          },
          {
            "id": "while-frontier",
            "text": "    while frontier:"
          },
          {
            "id": "select-min",
            "text": "        u = min(frontier, key=lambda n: (g[n] + h[n], n))"
          },
          {
            "id": "remove",
            "text": "        frontier.remove(u)"
          },
          {
            "id": "goal-check",
            "text": "        if u == goal:"
          },
          {
            "id": "path-start",
            "text": "            path = [u]"
          },
          {
            "id": "path-loop",
            "text": "            while path[0] != start:"
          },
          {
            "id": "reconstruct",
            "text": "                path.insert(0, parent[path[0]])"
          },
          {
            "id": "return-path",
            "text": "            return (g[u], path)"
          },
          {
            "id": "for-neighbor",
            "text": "        for v, w in graph[u]:"
          },
          {
            "id": "candidate",
            "text": "            candidate = g[u] + w"
          },
          {
            "id": "relax-condition",
            "text": "            if candidate < g.get(v, float('inf')):"
          },
          {
            "id": "update-distance",
            "text": "                g[v] = candidate"
          },
          {
            "id": "update-parent",
            "text": "                parent[v] = u"
          },
          {
            "id": "add-frontier",
            "text": "                frontier.add(v)"
          },
          {
            "id": "unreachable",
            "text": "    return (None, [])"
          }
        ]
      },
      "questions": [
        {
          "kind": "code-blank",
          "id": "select-priority",
          "prompt": "最小の優先値を持つ候補を選ぶコードを補ってください。",
          "stepId": "5-select-B-none",
          "choices": [
            {
              "id": "c1",
              "text": "h[n]"
            },
            {
              "id": "c2",
              "text": "g[n] + h[n]"
            },
            {
              "id": "c3",
              "text": "g[n]"
            }
          ],
          "correctAnswer": {
            "kind": "choice",
            "choiceId": "c2"
          },
          "requires": null,
          "reviewStepIds": [
            "6-keep-B-A"
          ],
          "tags": [
            "priority"
          ],
          "correctFeedback": "その判断で合っています。",
          "incorrectFeedback": "候補の値と更新条件をもう一度確認してみましょう。",
          "lineId": "select-min",
          "blank": {
            "start": 41,
            "length": 11
          }
        },
        {
          "kind": "code-blank",
          "id": "relax-condition",
          "prompt": "新しいコストが小さい場合だけ更新する条件を選んでください。",
          "stepId": "7-relax-B-D",
          "choices": [
            {
              "id": "c1",
              "text": ">"
            },
            {
              "id": "c2",
              "text": "=="
            },
            {
              "id": "c3",
              "text": "<"
            }
          ],
          "correctAnswer": {
            "kind": "choice",
            "choiceId": "c3"
          },
          "requires": null,
          "reviewStepIds": [
            "8-relax-B-E"
          ],
          "tags": [
            "relaxation"
          ],
          "correctFeedback": "その判断で合っています。",
          "incorrectFeedback": "候補の値と更新条件をもう一度確認してみましょう。",
          "lineId": "relax-condition",
          "blank": {
            "start": 25,
            "length": 1
          }
        },
        {
          "kind": "code-blank",
          "id": "update-g",
          "prompt": "新しい移動コストを記録するコードを選んでください。",
          "stepId": "7-relax-B-D",
          "choices": [
            {
              "id": "c1",
              "text": "w"
            },
            {
              "id": "c2",
              "text": "candidate"
            },
            {
              "id": "c3",
              "text": "g[u]"
            }
          ],
          "correctAnswer": {
            "kind": "choice",
            "choiceId": "c2"
          },
          "requires": null,
          "reviewStepIds": [
            "8-relax-B-E"
          ],
          "tags": [
            "relaxation"
          ],
          "correctFeedback": "その判断で合っています。",
          "incorrectFeedback": "候補の値と更新条件をもう一度確認してみましょう。",
          "lineId": "update-distance",
          "blank": {
            "start": 23,
            "length": 9
          }
        },
        {
          "kind": "code-blank",
          "id": "parent",
          "prompt": "直前に通った場所を記録するコードを選んでください。",
          "stepId": "7-relax-B-D",
          "choices": [
            {
              "id": "c1",
              "text": "= v"
            },
            {
              "id": "c2",
              "text": "= goal"
            },
            {
              "id": "c3",
              "text": "= u"
            }
          ],
          "correctAnswer": {
            "kind": "choice",
            "choiceId": "c3"
          },
          "requires": null,
          "reviewStepIds": [
            "8-relax-B-E"
          ],
          "tags": [
            "path"
          ],
          "correctFeedback": "その判断で合っています。",
          "incorrectFeedback": "候補の値と更新条件をもう一度確認してみましょう。",
          "lineId": "update-parent",
          "blank": {
            "start": 26,
            "length": 3
          }
        },
        {
          "kind": "code-blank",
          "id": "goal",
          "prompt": "ゴールを選んだときに探索を終える条件を選んでください。",
          "stepId": "12-select-F-none",
          "choices": [
            {
              "id": "c1",
              "text": "u == goal"
            },
            {
              "id": "c2",
              "text": "u == start"
            },
            {
              "id": "c3",
              "text": "not frontier"
            }
          ],
          "correctAnswer": {
            "kind": "choice",
            "choiceId": "c1"
          },
          "requires": null,
          "reviewStepIds": [
            "13-finish-F-none"
          ],
          "tags": [
            "path"
          ],
          "correctFeedback": "その判断で合っています。",
          "incorrectFeedback": "候補の値と更新条件をもう一度確認してみましょう。",
          "lineId": "goal-check",
          "blank": {
            "start": 11,
            "length": 9
          }
        }
      ]
    },
    "consolidation": {
      "version": 1,
      "kind": "diagnostic-check",
      "id": "astar-consolidation",
      "phase": 6,
      "code": {
        "id": "astar-v1",
        "version": 1,
        "language": "python",
        "lines": [
          {
            "id": "define-function",
            "text": "def astar(graph, start, goal, h):"
          },
          {
            "id": "init-distance",
            "text": "    g = {start: 0}"
          },
          {
            "id": "init-parent",
            "text": "    parent = {}"
          },
          {
            "id": "init-frontier",
            "text": "    frontier = {start}"
          },
          {
            "id": "while-frontier",
            "text": "    while frontier:"
          },
          {
            "id": "select-min",
            "text": "        u = min(frontier, key=lambda n: (g[n] + h[n], n))"
          },
          {
            "id": "remove",
            "text": "        frontier.remove(u)"
          },
          {
            "id": "goal-check",
            "text": "        if u == goal:"
          },
          {
            "id": "path-start",
            "text": "            path = [u]"
          },
          {
            "id": "path-loop",
            "text": "            while path[0] != start:"
          },
          {
            "id": "reconstruct",
            "text": "                path.insert(0, parent[path[0]])"
          },
          {
            "id": "return-path",
            "text": "            return (g[u], path)"
          },
          {
            "id": "for-neighbor",
            "text": "        for v, w in graph[u]:"
          },
          {
            "id": "candidate",
            "text": "            candidate = g[u] + w"
          },
          {
            "id": "relax-condition",
            "text": "            if candidate < g.get(v, float('inf')):"
          },
          {
            "id": "update-distance",
            "text": "                g[v] = candidate"
          },
          {
            "id": "update-parent",
            "text": "                parent[v] = u"
          },
          {
            "id": "add-frontier",
            "text": "                frontier.add(v)"
          },
          {
            "id": "unreachable",
            "text": "    return (None, [])"
          }
        ]
      },
      "questions": [
        {
          "kind": "choice",
          "id": "transfer-cost",
          "prompt": "この別のグラフでSからTまでの最小コストはいくつですか？",
          "stepId": "5-select-B-none",
          "choices": [
            {
              "id": "c1",
              "text": "7"
            },
            {
              "id": "c2",
              "text": "10"
            },
            {
              "id": "c3",
              "text": "12"
            }
          ],
          "correctAnswer": {
            "kind": "choice",
            "choiceId": "c1"
          },
          "requires": null,
          "reviewStepIds": [
            "6-keep-B-A"
          ],
          "tags": [
            "relaxation"
          ],
          "correctFeedback": "その判断で合っています。",
          "incorrectFeedback": "候補の値と更新条件をもう一度確認してみましょう。",
          "scene": {
            "kind": "weighted-transfer",
            "edges": [
              [
                "S",
                "X",
                8
              ],
              [
                "S",
                "Y",
                2
              ],
              [
                "Y",
                "X",
                2
              ],
              [
                "X",
                "T",
                3
              ],
              [
                "Y",
                "T",
                10
              ]
            ],
            "start": "S",
            "goal": "T",
            "heuristic": {
              "S": 4,
              "X": 2,
              "Y": 3,
              "T": 0
            }
          }
        },
        {
          "kind": "choice",
          "id": "transfer-update",
          "prompt": "Yを経由するとXへのコスト8は何に更新されますか？",
          "stepId": "5-select-B-none",
          "choices": [
            {
              "id": "c1",
              "text": "2"
            },
            {
              "id": "c2",
              "text": "4"
            },
            {
              "id": "c3",
              "text": "8"
            }
          ],
          "correctAnswer": {
            "kind": "choice",
            "choiceId": "c2"
          },
          "requires": null,
          "reviewStepIds": [
            "6-keep-B-A"
          ],
          "tags": [
            "relaxation"
          ],
          "correctFeedback": "その判断で合っています。",
          "incorrectFeedback": "候補の値と更新条件をもう一度確認してみましょう。",
          "scene": {
            "kind": "weighted-transfer",
            "edges": [
              [
                "S",
                "X",
                8
              ],
              [
                "S",
                "Y",
                2
              ],
              [
                "Y",
                "X",
                2
              ],
              [
                "X",
                "T",
                3
              ],
              [
                "Y",
                "T",
                10
              ]
            ],
            "start": "S",
            "goal": "T",
            "heuristic": {
              "S": 4,
              "X": 2,
              "Y": 3,
              "T": 0
            }
          }
        },
        {
          "kind": "choice",
          "id": "unreachable",
          "prompt": "ゴールを選べないまま候補が空になったら、どう判断しますか？",
          "stepId": "13-finish-F-none",
          "choices": [
            {
              "id": "c1",
              "text": "到達不能"
            },
            {
              "id": "c2",
              "text": "最後の場所がゴール"
            },
            {
              "id": "c3",
              "text": "コスト0"
            }
          ],
          "correctAnswer": {
            "kind": "choice",
            "choiceId": "c1"
          },
          "requires": null,
          "reviewStepIds": [
            "13-finish-F-none"
          ],
          "tags": [
            "path"
          ],
          "correctFeedback": "その判断で合っています。",
          "incorrectFeedback": "候補の値と更新条件をもう一度確認してみましょう。"
        },
        {
          "kind": "choice",
          "id": "zero-heuristic",
          "prompt": "すべてのhが0なら、候補の選び方はどの方法と同じですか？",
          "stepId": "5-select-B-none",
          "choices": [
            {
              "id": "c1",
              "text": "深さ優先探索"
            },
            {
              "id": "c2",
              "text": "ダイクストラ法"
            },
            {
              "id": "c3",
              "text": "貪欲最良優先探索"
            }
          ],
          "correctAnswer": {
            "kind": "choice",
            "choiceId": "c2"
          },
          "requires": null,
          "reviewStepIds": [
            "6-keep-B-A"
          ],
          "tags": [
            "priority"
          ],
          "correctFeedback": "その判断で合っています。",
          "incorrectFeedback": "候補の値と更新条件をもう一度確認してみましょう。"
        },
        {
          "kind": "parsons",
          "id": "code-order",
          "prompt": "候補の選択から隣の更新まで、コードを正しい順番に並べてください。",
          "stepId": "5-select-B-none",
          "lineIds": [
            "remove",
            "goal-check",
            "select-min",
            "candidate",
            "add-frontier",
            "for-neighbor",
            "update-parent",
            "relax-condition",
            "update-distance",
            "path-start",
            "path-loop",
            "reconstruct",
            "return-path"
          ],
          "correctAnswer": {
            "kind": "order",
            "lineIds": [
              "select-min",
              "remove",
              "goal-check",
              "path-start",
              "path-loop",
              "reconstruct",
              "return-path",
              "for-neighbor",
              "candidate",
              "relax-condition",
              "update-distance",
              "update-parent",
              "add-frontier"
            ]
          },
          "fixedLineIds": [
            "path-start",
            "path-loop",
            "reconstruct",
            "return-path"
          ],
          "requires": null,
          "reviewStepIds": [
            "5-select-B-none",
            "7-relax-B-D"
          ],
          "tags": [
            "flow"
          ],
          "correctFeedback": "探索の順番を正しく組み立てられました。",
          "incorrectFeedback": "候補選択、終了判定、隣の更新の順で考えましょう。"
        }
      ]
    },
    "code": {
      "id": "astar-v1",
      "version": 1,
      "language": "python",
      "lines": [
        {
          "id": "define-function",
          "text": "def astar(graph, start, goal, h):"
        },
        {
          "id": "init-distance",
          "text": "    g = {start: 0}"
        },
        {
          "id": "init-parent",
          "text": "    parent = {}"
        },
        {
          "id": "init-frontier",
          "text": "    frontier = {start}"
        },
        {
          "id": "while-frontier",
          "text": "    while frontier:"
        },
        {
          "id": "select-min",
          "text": "        u = min(frontier, key=lambda n: (g[n] + h[n], n))"
        },
        {
          "id": "remove",
          "text": "        frontier.remove(u)"
        },
        {
          "id": "goal-check",
          "text": "        if u == goal:"
        },
        {
          "id": "path-start",
          "text": "            path = [u]"
        },
        {
          "id": "path-loop",
          "text": "            while path[0] != start:"
        },
        {
          "id": "reconstruct",
          "text": "                path.insert(0, parent[path[0]])"
        },
        {
          "id": "return-path",
          "text": "            return (g[u], path)"
        },
        {
          "id": "for-neighbor",
          "text": "        for v, w in graph[u]:"
        },
        {
          "id": "candidate",
          "text": "            candidate = g[u] + w"
        },
        {
          "id": "relax-condition",
          "text": "            if candidate < g.get(v, float('inf')):"
        },
        {
          "id": "update-distance",
          "text": "                g[v] = candidate"
        },
        {
          "id": "update-parent",
          "text": "                parent[v] = u"
        },
        {
          "id": "add-frontier",
          "text": "                frontier.add(v)"
        },
        {
          "id": "unreachable",
          "text": "    return (None, [])"
        }
      ]
    }
  }
} as const;
