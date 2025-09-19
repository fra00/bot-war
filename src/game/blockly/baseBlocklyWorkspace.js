/**
 * @fileoverview Contiene la configurazione JSON di base per l'area di lavoro di Blockly.
 * Questo stato rappresenta una semplice macchina a stati (FSM) che può essere
 * caricata come punto di partenza per gli utenti.
 */

export const baseBlocklyWorkspace = {
  blocks: {
    languageVersion: 0,
    blocks: [
      {
        type: "ai_definition",
        id: "u[dJP|4sUxKLwmc#IZ/)",
        x: 101,
        y: -59,
        fields: {
          INITIAL_STATE: "SEARCHING",
        },
        inputs: {
          GLOBAL_TRANSITIONS: {
            block: {
              type: "fsm_tactical_transition",
              id: "nfr9YX^ZVAvi}L0oPPz+",
              fields: {
                TARGET: "ATTACKING",
                DESCRIPTION: "descrizione transizione",
              },
              inputs: {
                CONDITION: {
                  block: {
                    type: "is_enemy_visible",
                    id: "z$YCx#!/5N#jGu$RHl=z",
                  },
                },
              },
              next: {
                block: {
                  type: "fsm_tactical_transition",
                  id: "l*Tw;%Vb.tH:m@gVz0,7",
                  fields: {
                    TARGET: "RECHARGING",
                    DESCRIPTION: "descrizione transizione",
                  },
                  inputs: {
                    CONDITION: {
                      block: {
                        type: "logic_compare",
                        id: "EP|0%FZ.RLI809j/`Hja",
                        fields: {
                          OP: "LTE",
                        },
                        inputs: {
                          A: {
                            block: {
                              type: "context_battery_percent",
                              id: "e#wUj-1LWMv+d+0{04F]",
                            },
                          },
                          B: {
                            block: {
                              type: "math_number",
                              id: "aHzKCy8/wJWxC?+XG`cF",
                              fields: {
                                NUM: 30,
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                  next: {
                    block: {
                      type: "fsm_emergency_transition",
                      id: "ey`ie5N)?$8Z@_8T@8rG",
                      fields: {
                        TARGET: "STRAFE",
                        DESCRIPTION: "descrizione transizione",
                      },
                      inputs: {
                        CONDITION: {
                          block: {
                            type: "is_projectile_incoming",
                            id: "${p(A$IZWGDwMoKok?gM",
                          },
                        },
                      },
                      next: {
                        block: {
                          type: "fsm_emergency_transition",
                          id: "zs6{iqf3}M-UjjbB.al*",
                          fields: {
                            TARGET: "EVADING",
                            DESCRIPTION: "descrizione transizione",
                          },
                          inputs: {
                            CONDITION: {
                              block: {
                                type: "was_hit",
                                id: "?Y@{?b57H]E92=D*K21Q",
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          STATES: {
            block: {
              type: "fsm_state",
              id: "mJvucjX7TovQ?V8Mon{0",
              fields: {
                STATE_NAME: "SEARCHING",
              },
              inputs: {
                ON_ENTER: {
                  block: {
                    type: "api_log",
                    id: "/Hi8^nHM6*TK%P`eI%,M",
                    inputs: {
                      MESSAGE: {
                        block: {
                          type: "text",
                          id: "@jqjSq?Va`FR6_HPP@/#",
                          fields: {
                            TEXT: "Inizio pattugliamento",
                          },
                        },
                      },
                    },
                  },
                },
                ON_EXECUTE: {
                  block: {
                    type: "local_scope",
                    id: "QwjCnFj2W)YD*uVYOH[m",
                    inputs: {
                      VARIABLES: {
                        block: {
                          type: "local_declare_variable",
                          id: "hF.?{T[q;;W0uJw@a-6]",
                          fields: {
                            VAR_NAME: "point",
                          },
                          inputs: {
                            INITIAL_VALUE: {
                              shadow: {
                                type: "math_number",
                                id: "@EL1{tB{F`vK@?NTn[+v",
                                fields: {
                                  NUM: 0,
                                },
                              },
                            },
                          },
                        },
                      },
                      BODY: {
                        block: {
                          type: "controls_if",
                          id: "?BPeT?H{*8r]XOMgqo,/",
                          inputs: {
                            IF0: {
                              block: {
                                type: "api_is_queue_empty",
                                id: "iK+#wg,D.jVdbv_n{_DE",
                              },
                            },
                            DO0: {
                              block: {
                                type: "local_set_variable",
                                id: ";)Bd6E5o2UH[o:%*|X6u",
                                fields: {
                                  VAR_NAME: "point",
                                },
                                inputs: {
                                  VALUE: {
                                    block: {
                                      type: "api_get_random_point",
                                      id: "RLKZ2=kC{v(ER2^s79o/",
                                    },
                                  },
                                },
                                next: {
                                  block: {
                                    type: "controls_if",
                                    id: "e}JW9QX51M@1u~Tjj8rm",
                                    inputs: {
                                      IF0: {
                                        block: {
                                          type: "memory_get",
                                          id: "*6K3+bT^^rwYQ1KE6|yt",
                                          fields: {
                                            KEY: "enemyPosition",
                                          },
                                        },
                                      },
                                      DO0: {
                                        block: {
                                          type: "local_set_variable",
                                          id: "2KEws^$WMbx69Ogur|.q",
                                          fields: {
                                            VAR_NAME: "point",
                                          },
                                          inputs: {
                                            VALUE: {
                                              block: {
                                                type: "memory_get",
                                                id: "39Tp[Sz3Z*h-*pGP`TX+",
                                                fields: {
                                                  KEY: "enemyPosition",
                                                },
                                              },
                                            },
                                          },
                                        },
                                      },
                                    },
                                    next: {
                                      block: {
                                        type: "controls_if",
                                        id: "uGc%|9,;+hD%2N_@pq-6",
                                        inputs: {
                                          IF0: {
                                            block: {
                                              type: "local_get_variable",
                                              id: "i)Dd`;YL+B)`0ThJs3Q#",
                                              fields: {
                                                VAR_NAME: "point",
                                              },
                                            },
                                          },
                                          DO0: {
                                            block: {
                                              type: "controls_if",
                                              id: "j|Lri2l7[#2[I.5[xUaZ",
                                              inputs: {
                                                IF0: {
                                                  block: {
                                                    type: "actions_move_to_and_check",
                                                    id: "w/E5;r2I8E}*dQ9ZciRo",
                                                    inputs: {
                                                      POSITION: {
                                                        block: {
                                                          type: "local_get_variable",
                                                          id: "bopuO8k*Cm:^9WRK-C[w",
                                                          fields: {
                                                            VAR_NAME: "point",
                                                          },
                                                        },
                                                      },
                                                    },
                                                  },
                                                },
                                                DO0: {
                                                  block: {
                                                    type: "api_log",
                                                    id: "@dtTOJ(hYAbt*}sc@t-L",
                                                    inputs: {
                                                      MESSAGE: {
                                                        block: {
                                                          type: "text",
                                                          id: ":9$|v?%f$IZXF;|+7u_n",
                                                          fields: {
                                                            TEXT: "Inizio movimento",
                                                          },
                                                        },
                                                      },
                                                    },
                                                  },
                                                },
                                              },
                                            },
                                          },
                                        },
                                      },
                                    },
                                  },
                                },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
              next: {
                block: {
                  type: "fsm_state",
                  id: "Dvg1xi#%wnm=s[A_]TnU",
                  fields: {
                    STATE_NAME: "ATTACKING",
                  },
                  inputs: {
                    ON_ENTER: {
                      block: {
                        type: "api_log",
                        id: "F~ys3WN(X7$xX{O5s.cy",
                        inputs: {
                          MESSAGE: {
                            block: {
                              type: "text",
                              id: "U.aGc3orC9;2!dI=w$OK",
                              fields: {
                                TEXT: "Inizio attacco",
                              },
                            },
                          },
                        },
                      },
                    },
                    ON_EXECUTE: {
                      block: {
                        type: "controls_if",
                        id: "5m_bj~h}[e}$p~G608L|",
                        inputs: {
                          IF0: {
                            block: {
                              type: "logic_negate",
                              id: "CD|M7-LzGq%`Z-80mz_o",
                              inputs: {
                                BOOL: {
                                  block: {
                                    type: "is_enemy_visible",
                                    id: "9$2u4Nw73m6pW~Z2{U5H",
                                  },
                                },
                              },
                            },
                          },
                          DO0: {
                            block: {
                              type: "fsm_return_state",
                              id: "Nj04MX#yxhK5,q%KB_1.",
                              fields: {
                                STATE_NAME: "SEARCHING",
                              },
                            },
                          },
                        },
                        next: {
                          block: {
                            type: "memory_set",
                            id: "^.=bAxJ.SQKYhf39;;Rl",
                            fields: {
                              KEY: "enemyPosition",
                            },
                            inputs: {
                              VALUE: {
                                block: {
                                  type: "get_enemy_position",
                                  id: "[Q+W.{.[]x$vL*7)vyAx",
                                },
                              },
                            },
                            next: {
                              block: {
                                type: "controls_if",
                                id: "f|O38).SWS*!_~prRjz/",
                                inputs: {
                                  IF0: {
                                    block: {
                                      type: "api_is_queue_empty",
                                      id: "V~ZYd5I={SpL+!$8^F?x",
                                    },
                                  },
                                  DO0: {
                                    block: {
                                      type: "aim_at_enemy",
                                      id: "^wXGjACGVdeS.E/v^rF(",
                                    },
                                  },
                                },
                                next: {
                                  block: {
                                    type: "controls_if",
                                    id: "{1$5+Jr,#lFobU:j,{D;",
                                    inputs: {
                                      IF0: {
                                        block: {
                                          type: "logic_operation",
                                          id: "l34+549qz8neW@/c#4;[",
                                          fields: {
                                            OP: "AND",
                                          },
                                          inputs: {
                                            A: {
                                              block: {
                                                type: "logic_compare",
                                                id: "vIyu*,kEOIKzGmAizjq9",
                                                fields: {
                                                  OP: "LTE",
                                                },
                                                inputs: {
                                                  A: {
                                                    block: {
                                                      type: "get_enemy_angle",
                                                      id: "`Ki{AKvQf||e;q{yN,C$",
                                                    },
                                                  },
                                                  B: {
                                                    block: {
                                                      type: "game_constant",
                                                      id: "!z0XI^9M7=`p$XasQmI=",
                                                      fields: {
                                                        CONSTANT:
                                                          "aimTolerance",
                                                      },
                                                    },
                                                  },
                                                },
                                              },
                                            },
                                            B: {
                                              block: {
                                                type: "api_is_line_of_sight_clear",
                                                id: "!po)VuM3uSv^OhnJv|O6",
                                                inputs: {
                                                  POSITION: {
                                                    shadow: {
                                                      type: "get_enemy_position",
                                                      id: "Z;?0hKEq^g+H,wntg,]h",
                                                    },
                                                  },
                                                },
                                              },
                                            },
                                          },
                                        },
                                      },
                                      DO0: {
                                        block: {
                                          type: "api_fire",
                                          id: "6BILD+wtwT5n|FveIr56",
                                        },
                                      },
                                    },
                                  },
                                },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                  next: {
                    block: {
                      type: "fsm_state",
                      id: "Q_N?G0I?x]#^J;4P5Eha",
                      fields: {
                        STATE_NAME: "RECHARGING",
                      },
                      inputs: {
                        ON_ENTER: {
                          block: {
                            type: "api_move_random",
                            id: "+p]f)BC:IapEk/=y|sWD",
                          },
                        },
                        ON_EXECUTE: {
                          block: {
                            type: "controls_if",
                            id: "_lwvP8k|^[Ax$XT[CXUe",
                            inputs: {
                              IF0: {
                                block: {
                                  type: "api_is_queue_empty",
                                  id: "#e2.%w4r0I2v=}8R4CeN",
                                },
                              },
                              DO0: {
                                block: {
                                  type: "controls_if",
                                  id: "Y$[tDmYg%RKY%H{_R?yn",
                                  inputs: {
                                    IF0: {
                                      block: {
                                        type: "is_enemy_visible",
                                        id: "_?]Z_)i0Z+XHGh-|%~TJ",
                                      },
                                    },
                                    DO0: {
                                      block: {
                                        type: "fsm_return_state",
                                        id: "{v;KdvpAX+|.qsz*1e|]",
                                        fields: {
                                          STATE_NAME: "SEARCHING",
                                        },
                                      },
                                    },
                                  },
                                },
                              },
                            },
                            next: {
                              block: {
                                type: "controls_if",
                                id: "lgJUS5*3+dA^9W[XK#2;",
                                inputs: {
                                  IF0: {
                                    block: {
                                      type: "logic_compare",
                                      id: "aecIvhq:!)R2P^n+uBzz",
                                      fields: {
                                        OP: "GTE",
                                      },
                                      inputs: {
                                        A: {
                                          block: {
                                            type: "context_battery_percent",
                                            id: "3j_[:|2I_/roUl=;hQ{B",
                                          },
                                        },
                                        B: {
                                          block: {
                                            type: "math_number",
                                            id: "OZt,`D_Ai]eea2n;m9t?",
                                            fields: {
                                              NUM: 70,
                                            },
                                          },
                                        },
                                      },
                                    },
                                  },
                                  DO0: {
                                    block: {
                                      type: "fsm_return_state",
                                      id: "`2PpkV(yRz1WCQW2GQzA",
                                      fields: {
                                        STATE_NAME: "SEARCHING",
                                      },
                                    },
                                  },
                                },
                              },
                            },
                          },
                        },
                        INTERRUPTIBLE_BY: {
                          block: {
                            type: "state_reference",
                            id: "@+.QOaK.FPv`N/%-I@;l",
                            fields: {
                              STATE_NAME: "NESSUNO",
                            },
                          },
                        },
                      },
                      next: {
                        block: {
                          type: "fsm_state",
                          id: "p_XyLLccCR{4}Kak;:yX",
                          fields: {
                            STATE_NAME: "EVADING",
                          },
                          inputs: {
                            ON_EXECUTE: {
                              block: {
                                type: "controls_if",
                                id: "$v`w_*kj-1bGb^U=y^*T",
                                inputs: {
                                  IF0: {
                                    block: {
                                      type: "api_is_queue_empty",
                                      id: "K=hToXJY(+[NtjzCTK?X",
                                    },
                                  },
                                  DO0: {
                                    block: {
                                      type: "api_move_random",
                                      id: "Ed]s*6^G}c{HZjXnv{-|",
                                    },
                                  },
                                },
                              },
                            },
                            TRANSITIONS: {
                              block: {
                                type: "fsm_transition",
                                id: ":L!C@~ue_KFiA0/Ell{z",
                                fields: {
                                  TARGET: "SEARCHING",
                                  DESCRIPTION: "opzionale",
                                },
                                inputs: {
                                  CONDITION: {
                                    block: {
                                      type: "api_is_queue_empty",
                                      id: "Q;!]snEjUf/Dah0~^COc",
                                    },
                                  },
                                },
                              },
                            },
                            INTERRUPTIBLE_BY: {
                              block: {
                                type: "state_reference",
                                id: "Vu},DM80Kn#.)w}B2],2",
                                fields: {
                                  STATE_NAME: "NESSUNO",
                                },
                              },
                            },
                          },
                          next: {
                            block: {
                              type: "fsm_state",
                              id: "fYO+Qu.UlvnatEAvsCg)",
                              fields: {
                                STATE_NAME: "STRAFE",
                              },
                              inputs: {
                                ON_ENTER: {
                                  block: {
                                    type: "api_strafe",
                                    id: "2h_i80u#o{uAFR_oWlc(",
                                    inputs: {
                                      DIRECTION: {
                                        shadow: {
                                          type: "text",
                                          id: "F-(%5JgiH9Y)-K=1t1`]",
                                          fields: {
                                            TEXT: "left",
                                          },
                                        },
                                      },
                                    },
                                  },
                                },
                                TRANSITIONS: {
                                  block: {
                                    type: "fsm_transition",
                                    id: "BbE[K^2PGP`gdx?A.uN4",
                                    fields: {
                                      TARGET: "SEARCHING",
                                      DESCRIPTION: "opzionale",
                                    },
                                    inputs: {
                                      CONDITION: {
                                        block: {
                                          type: "api_is_queue_empty",
                                          id: "nZC9Femq}^og$EpwLf_k",
                                        },
                                      },
                                    },
                                  },
                                },
                                INTERRUPTIBLE_BY: {
                                  block: {
                                    type: "state_reference",
                                    id: "`xNb-,GNiz$:,5pRRI@N",
                                    fields: {
                                      STATE_NAME: "NESSUNO",
                                    },
                                  },
                                },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    ],
  },
  variables: [
    {
      name: "rnd",
      id: "9,PP**O}yqz;-89eBD3+",
    },
  ],
};
