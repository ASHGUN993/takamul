/* محتوى موقع «تكامل» — يُعدَّل من المحرّر (#editor). */
window.TAKAMUL = {
 "site": {
  "name": "تكامل",
  "tagline": "كل المواد، معرفة واحدة",
  "featured": "bio-cell-respiration"
 },
 "aliases": {
  "أدينوسين ثلاثي الفوسفات": "ATP"
 },
 "labs": [
  {
   "id": "yeast-respiration",
   "title": "محاكاة: تنفس الخميرة",
   "src": "labs/yeast-respiration/index.html",
   "ratio": "16/10"
  }
 ],
 "subjects": [
  {
   "id": "bio",
   "name": "أحياء",
   "color": "#20B486",
   "icon": "bio",
   "topics": [
    {
     "id": "bio-cell",
     "name": "الخلية",
     "branches": [
      {
       "id": "bio-cell-structure",
       "name": "تركيب الخلية",
       "lessons": [
        "bio-membrane",
        "bio-organelles",
        "bio-mito"
       ]
      },
      {
       "id": "bio-cell-processes",
       "name": "العمليات الحيوية داخل الخلية",
       "lessons": [
        "bio-photosynthesis",
        "bio-protein",
        "bio-cell-respiration"
       ]
      },
      {
       "id": "bio-cell-division",
       "name": "انقسام الخلية",
       "lessons": [
        "bio-mitosis",
        "bio-meiosis"
       ]
      }
     ]
    },
    {
     "id": "bio-genetics",
     "name": "الوراثة",
     "branches": [
      {
       "id": "bio-gen-material",
       "name": "المادة الوراثية",
       "lessons": [
        "bio-dna",
        "bio-dna-rep"
       ]
      },
      {
       "id": "bio-gen-patterns",
       "name": "أنماط الوراثة",
       "lessons": [
        "bio-mendel",
        "bio-sexlinked"
       ]
      }
     ]
    },
    {
     "id": "bio-body",
     "name": "أجهزة جسم الإنسان",
     "branches": [
      {
       "id": "bio-circ",
       "name": "الجهاز الدوري",
       "lessons": [
        "bio-heart",
        "bio-blood"
       ]
      },
      {
       "id": "bio-resp-sys",
       "name": "الجهاز التنفسي",
       "lessons": [
        "bio-gas-exchange"
       ]
      }
     ]
    },
    {
     "id": "bio-eco",
     "name": "البيئة",
     "branches": [
      {
       "id": "bio-ecosystems",
       "name": "الأنظمة البيئية",
       "lessons": [
        "bio-food-chains",
        "bio-energy-flow"
       ]
      }
     ]
    }
   ]
  },
  {
   "id": "chem",
   "name": "كيمياء",
   "color": "#8E5CF0",
   "icon": "chem",
   "topics": [
    {
     "id": "chem-matter",
     "name": "المادة وتركيبها",
     "branches": [
      {
       "id": "chem-atom",
       "name": "الذرة",
       "lessons": [
        "chem-atom-structure",
        "chem-electron-config"
       ]
      },
      {
       "id": "chem-bonds",
       "name": "الروابط الكيميائية",
       "lessons": [
        "chem-ionic",
        "chem-covalent"
       ]
      }
     ]
    },
    {
     "id": "chem-reactions",
     "name": "التفاعلات الكيميائية",
     "branches": [
      {
       "id": "chem-energy-reactions",
       "name": "الطاقة في التفاعلات",
       "lessons": [
        "chem-energy",
        "chem-endo-exo"
       ]
      },
      {
       "id": "chem-redox-b",
       "name": "الأكسدة والاختزال",
       "lessons": [
        "chem-redox"
       ]
      }
     ]
    },
    {
     "id": "chem-organic",
     "name": "الكيمياء العضوية",
     "branches": [
      {
       "id": "chem-organic-compounds",
       "name": "المركبات العضوية",
       "lessons": [
        "chem-hydrocarbons",
        "chem-carbs"
       ]
      }
     ]
    }
   ]
  },
  {
   "id": "phys",
   "name": "فيزياء",
   "color": "#2F80ED",
   "icon": "phys",
   "topics": [
    {
     "id": "phys-energy",
     "name": "الطاقة",
     "branches": [
      {
       "id": "phys-energy-forms",
       "name": "أشكال الطاقة",
       "lessons": [
        "phys-energy-transform",
        "phys-energy-conservation"
       ]
      },
      {
       "id": "phys-heat",
       "name": "الحرارة",
       "lessons": [
        "phys-heat-transfer"
       ]
      }
     ]
    },
    {
     "id": "phys-motion",
     "name": "الحركة",
     "branches": [
      {
       "id": "phys-newton",
       "name": "قوانين نيوتن",
       "lessons": [
        "phys-newton1",
        "phys-newton2"
       ]
      }
     ]
    },
    {
     "id": "phys-em",
     "name": "الكهرباء والمغناطيسية",
     "branches": [
      {
       "id": "phys-static",
       "name": "الكهرباء الساكنة",
       "lessons": [
        "phys-charge"
       ]
      },
      {
       "id": "phys-magnet",
       "name": "المجال المغناطيسي",
       "lessons": [
        "phys-magnets"
       ]
      }
     ]
    }
   ]
  },
  {
   "id": "math",
   "name": "رياضيات",
   "color": "#F2A900",
   "icon": "math",
   "topics": [
    {
     "id": "math-algebra",
     "name": "الجبر",
     "branches": [
      {
       "id": "math-equations",
       "name": "المعادلات",
       "lessons": [
        "math-linear",
        "math-quadratic"
       ]
      },
      {
       "id": "math-functions",
       "name": "الدوال",
       "lessons": [
        "math-function-concept",
        "math-exponential"
       ]
      }
     ]
    },
    {
     "id": "math-geometry",
     "name": "الهندسة",
     "branches": [
      {
       "id": "math-shapes",
       "name": "الأشكال الهندسية",
       "lessons": [
        "math-triangles",
        "math-circle"
       ]
      }
     ]
    },
    {
     "id": "math-stats",
     "name": "الإحصاء والاحتمالات",
     "branches": [
      {
       "id": "math-statistics",
       "name": "الإحصاء",
       "lessons": [
        "math-mean-median"
       ]
      }
     ]
    }
   ]
  },
  {
   "id": "ar",
   "name": "لغة عربية",
   "color": "#0FA3B1",
   "icon": "ar",
   "topics": [
    {
     "id": "ar-grammar",
     "name": "النحو",
     "branches": [
      {
       "id": "ar-nominal",
       "name": "الجملة الاسمية",
       "lessons": [
        "ar-mubtada"
       ]
      },
      {
       "id": "ar-relative",
       "name": "الأسماء الموصولة",
       "lessons": [
        "ar-mawsool"
       ]
      }
     ]
    },
    {
     "id": "ar-rhetoric",
     "name": "البلاغة",
     "branches": [
      {
       "id": "ar-bayan",
       "name": "علم البيان",
       "lessons": [
        "ar-tashbih",
        "ar-istiara"
       ]
      }
     ]
    },
    {
     "id": "ar-lit",
     "name": "الأدب",
     "branches": [
      {
       "id": "ar-poetry",
       "name": "الشعر",
       "lessons": [
        "ar-abbasid"
       ]
      }
     ]
    }
   ]
  },
  {
   "id": "en",
   "name": "لغة إنجليزية",
   "color": "#D9488F",
   "icon": "en",
   "topics": [
    {
     "id": "en-grammar",
     "name": "Grammar",
     "branches": [
      {
       "id": "en-tenses",
       "name": "Tenses",
       "lessons": [
        "en-present-simple",
        "en-past-simple"
       ]
      }
     ]
    },
    {
     "id": "en-reading",
     "name": "Reading",
     "branches": [
      {
       "id": "en-science-texts",
       "name": "Science Texts",
       "lessons": [
        "en-reading-cells"
       ]
      }
     ]
    }
   ],
   "dir": "ltr"
  },
  {
   "id": "earth",
   "name": "علوم الأرض",
   "color": "#A47148",
   "icon": "earth",
   "topics": [
    {
     "id": "earth-structure",
     "name": "الأرض وبنيتها",
     "branches": [
      {
       "id": "earth-layers-b",
       "name": "طبقات الأرض",
       "lessons": [
        "earth-layers"
       ]
      },
      {
       "id": "earth-plates",
       "name": "الصفائح التكتونية",
       "lessons": [
        "earth-quakes"
       ]
      }
     ]
    },
    {
     "id": "earth-atmo",
     "name": "الغلاف الجوي",
     "branches": [
      {
       "id": "earth-weather",
       "name": "الطقس",
       "lessons": [
        "earth-water-cycle",
        "earth-pressure"
       ]
      }
     ]
    }
   ]
  }
 ],
 "lessons": [
  {
   "id": "bio-membrane",
   "title": "الغشاء البلازمي"
  },
  {
   "id": "bio-organelles",
   "title": "العضيات الخلوية"
  },
  {
   "id": "bio-mito",
   "title": "تركيب الميتوكوندريا"
  },
  {
   "id": "bio-cell-respiration",
   "title": "التنفس الخلوي",
   "sample": true,
   "subtitle": "كيف تحوّل الخلية الغذاء إلى طاقة تستطيع استخدامها؟",
   "code": "G10-S2-U4-L3",
   "minutes": 8,
   "cover": "images/cell-respiration-cover.svg",
   "updated": "2026-10-19",
   "summary": "التنفس الخلوي عملية تحدث في خلايا الكائنات الحية، يُفكَّك فيها الجلوكوز بوجود الأكسجين لإنتاج الطاقة على شكل جزيئات ATP، ويخرج منها ثاني أكسيد الكربون والماء. يبدأ في السيتوبلازم ويكتمل داخل الميتوكوندريا.",
   "keywords": [
    "تنفس",
    "طاقة",
    "ATP",
    "ميتوكوندريا",
    "جلوكوز",
    "أكسجين",
    "خميرة",
    "تخمر",
    "عضلات",
    "ركض"
   ],
   "faq": [
    "كيف تحصل الخلية على الطاقة؟",
    "أين يحدث التنفس الخلوي؟",
    "لماذا نتنفس بسرعة عند الركض؟",
    "ما الفرق بين التنفس الهوائي واللاهوائي؟"
   ],
   "body": "![](images/musa-khidr-scene-05-8pklt.png)\n\n## مقدمة\nتحتاج كل خلية حية إلى طاقة مستمرة لتؤدي وظائفها: الحركة، والنمو، وبناء المواد، ونقلها عبر الغشاء. تحصل الخلية على هذه الطاقة من الغذاء، لكنها لا تستطيع استخدام الغذاء مباشرة؛ بل تحوّل الطاقة المختزنة في [[الجلوكوز|درس:chem-carbs]] إلى صورة قابلة للاستخدام هي جزيئات [[ATP|درس:chem-energy]].\n\nيحدث معظم التنفس الخلوي داخل [[الميتوكوندريا|درس:bio-mito]]، ولهذا تُسمّى «مصنع الطاقة» في الخلية.\n\n## معادلة التنفس الخلوي\n![المتفاعلات والنواتج في التنفس الخلوي الهوائي](images/respiration-equation.svg)\n\nيتفاعل الجلوكوز مع [[الأكسجين|درس:chem-redox]] فينتج ثاني أكسيد الكربون والماء، وتنطلق [[الطاقة|درس:phys-energy-transform]] التي تُخزَّن في جزيئات ATP.\n\n## مراحل التنفس الخلوي\n- **التحلل السكري:** يحدث في السيتوبلازم، وينقسم فيه جزيء الجلوكوز إلى جزيئين أصغر، وينتج عدد قليل من جزيئات ATP.\n- **حلقة كربس:** تحدث في حشوة الميتوكوندريا، ويخرج فيها ثاني أكسيد الكربون.\n- **سلسلة نقل الإلكترونات:** تحدث على الغشاء الداخلي للميتوكوندريا، ويُستهلك فيها الأكسجين وينتج معظم جزيئات ATP.\n\nينتج عن تفكك جزيء جلوكوز واحد في التنفس الهوائي نحو 30 إلى 32 جزيء ATP.\n\n## التنفس الهوائي واللاهوائي\nعند توافر الأكسجين تُكمل الخلية المراحل الثلاث، وهذا **التنفس الهوائي**. وعند نقص الأكسجين تتوقف بعد التحلل السكري وتلجأ إلى **التخمر**، فتحصل على طاقة أقل بكثير:\n- في **الخميرة** ينتج التخمر الكحول الإيثيلي وثاني أكسيد الكربون، ولهذا ينتفخ العجين.\n- في **العضلات** عند الجهد الشديد ينتج حمض اللاكتيك.\n\nولهذا نتنفس بسرعة عند الركض: تحتاج العضلات إلى أكسجين أكثر لإنتاج ATP بالتنفس الهوائي، ويحتاج الجسم إلى التخلص من ثاني أكسيد الكربون الزائد.\n\n## جرّب بنفسك\n::lab[yeast-respiration]\n\nغيّر درجة الحرارة وكمية السكر، ولاحظ كيف يتغير عدد فقاعات ثاني أكسيد الكربون التي تطلقها الخميرة. وللاستزادة اقرأ عن [[التنفس الخلوي|https://ar.wikipedia.org/wiki/تنفس_خلوي]] في ويكيبيديا.\n"
  },
  {
   "id": "bio-photosynthesis",
   "title": "البناء الضوئي"
  },
  {
   "id": "bio-protein",
   "title": "بناء البروتين"
  },
  {
   "id": "bio-mitosis",
   "title": "الانقسام المتساوي"
  },
  {
   "id": "bio-meiosis",
   "title": "الانقسام المنصف"
  },
  {
   "id": "bio-dna",
   "title": "تركيب DNA"
  },
  {
   "id": "bio-dna-rep",
   "title": "تضاعف DNA"
  },
  {
   "id": "bio-mendel",
   "title": "قوانين مندل"
  },
  {
   "id": "bio-sexlinked",
   "title": "الوراثة المرتبطة بالجنس"
  },
  {
   "id": "bio-heart",
   "title": "القلب"
  },
  {
   "id": "bio-blood",
   "title": "الدم"
  },
  {
   "id": "bio-gas-exchange",
   "title": "تبادل الغازات"
  },
  {
   "id": "bio-food-chains",
   "title": "السلاسل الغذائية"
  },
  {
   "id": "bio-energy-flow",
   "title": "تدفق الطاقة في النظام البيئي"
  },
  {
   "id": "chem-atom-structure",
   "title": "تركيب الذرة"
  },
  {
   "id": "chem-electron-config",
   "title": "التوزيع الإلكتروني"
  },
  {
   "id": "chem-ionic",
   "title": "الرابطة الأيونية"
  },
  {
   "id": "chem-covalent",
   "title": "الرابطة التساهمية"
  },
  {
   "id": "chem-energy",
   "title": "الطاقة الكيميائية والروابط",
   "sample": true,
   "subtitle": "أين تختزن المواد الطاقة، وكيف تنطلق منها؟",
   "minutes": 4,
   "updated": "2026-10-18",
   "summary": "تُختزن الطاقة الكيميائية في الروابط بين الذرات. يحتاج كسر الروابط إلى طاقة، وينطلق من تكوين روابط جديدة طاقة، والفرق بينهما يحدد هل التفاعل ماص أم طارد للطاقة. ومثال ذلك في الخلية تحلّل جزيء ATP.",
   "keywords": [
    "طاقة كيميائية",
    "روابط",
    "ATP",
    "ADP",
    "فوسفات",
    "تفاعل طارد",
    "تفاعل ماص"
   ],
   "faq": [
    "من أين تأتي الطاقة في التفاعل الكيميائي؟",
    "كيف يعطي ATP الطاقة للخلية؟"
   ],
   "body": "## الطاقة في الروابط\nتتكوّن المواد من ذرات ترتبط معًا بروابط كيميائية. **كسر** الرابطة يحتاج إلى طاقة، و**تكوين** رابطة جديدة يُطلق طاقة. فإذا كانت الطاقة المنطلقة من تكوين الروابط الجديدة أكبر من الطاقة اللازمة لكسر الروابط القديمة، كان التفاعل **طاردًا** للطاقة.\n\n## مثال من الخلية: جزيء ATP\nجزيء [[ATP|درس:bio-cell-respiration]] (أدينوسين ثلاثي الفوسفات) هو «عملة الطاقة» في الخلية. عندما يتحلّل إلى ADP ومجموعة فوسفات تنطلق [[الطاقة|درس:phys-energy-transform]] التي تستخدمها الخلية في أنشطتها، ثم يُعاد بناؤه أثناء التنفس الخلوي.\n"
  },
  {
   "id": "chem-endo-exo",
   "title": "التفاعلات الماصة والطاردة للطاقة"
  },
  {
   "id": "chem-redox",
   "title": "تفاعلات الأكسدة والاختزال"
  },
  {
   "id": "chem-hydrocarbons",
   "title": "الهيدروكربونات"
  },
  {
   "id": "chem-carbs",
   "title": "الكربوهيدرات"
  },
  {
   "id": "phys-energy-transform",
   "title": "تحولات الطاقة",
   "sample": true,
   "subtitle": "الطاقة لا تفنى، لكنها تتحول من شكل إلى آخر.",
   "minutes": 4,
   "updated": "2026-10-17",
   "summary": "تتحول الطاقة من شكل إلى آخر دون أن تفنى أو تُستحدث، مثل تحول الطاقة الضوئية إلى كيميائية في البناء الضوئي، والكيميائية إلى حركية وحرارية في عضلاتنا.",
   "keywords": [
    "تحولات الطاقة",
    "طاقة حركية",
    "طاقة حرارية",
    "طاقة ضوئية",
    "طاقة كيميائية",
    "حفظ الطاقة"
   ],
   "faq": [
    "ما معنى أن الطاقة لا تفنى؟",
    "كيف تتحول الطاقة في جسم الإنسان؟"
   ],
   "body": "## أشكال الطاقة\nللطاقة أشكال كثيرة: حركية، وحرارية، وضوئية، وكهربائية، و[[الطاقة|درس:chem-energy]] الكيميائية المختزنة في المواد.\n\n## سلسلة تحولات من الشمس إلى العضلة\n- في [[البناء الضوئي|درس:bio-photosynthesis]] تتحول الطاقة **الضوئية** إلى طاقة **كيميائية** مختزنة في الجلوكوز.\n- في [[التنفس الخلوي|درس:bio-cell-respiration]] تتحول الطاقة الكيميائية في الجلوكوز إلى طاقة في جزيئات ATP.\n- في العضلة تتحول طاقة ATP إلى طاقة **حركية**، وجزء منها يتحول إلى طاقة **حرارية**، ولهذا ترتفع حرارة الجسم عند الرياضة.\n"
  },
  {
   "id": "phys-energy-conservation",
   "title": "حفظ الطاقة"
  },
  {
   "id": "phys-heat-transfer",
   "title": "انتقال الحرارة"
  },
  {
   "id": "phys-newton1",
   "title": "القانون الأول لنيوتن"
  },
  {
   "id": "phys-newton2",
   "title": "القانون الثاني لنيوتن"
  },
  {
   "id": "phys-charge",
   "title": "الشحنة الكهربائية"
  },
  {
   "id": "phys-magnets",
   "title": "المغناطيس"
  },
  {
   "id": "math-linear",
   "title": "المعادلات الخطية"
  },
  {
   "id": "math-quadratic",
   "title": "المعادلات التربيعية"
  },
  {
   "id": "math-function-concept",
   "title": "مفهوم الدالة"
  },
  {
   "id": "math-exponential",
   "title": "الدوال الأسية"
  },
  {
   "id": "math-triangles",
   "title": "المثلثات"
  },
  {
   "id": "math-circle",
   "title": "الدائرة"
  },
  {
   "id": "math-mean-median",
   "title": "الوسط الحسابي والوسيط"
  },
  {
   "id": "ar-mubtada",
   "title": "المبتدأ والخبر"
  },
  {
   "id": "ar-mawsool",
   "title": "الاسم الموصول وصلته"
  },
  {
   "id": "ar-tashbih",
   "title": "التشبيه"
  },
  {
   "id": "ar-istiara",
   "title": "الاستعارة"
  },
  {
   "id": "ar-abbasid",
   "title": "الشعر في العصر العباسي"
  },
  {
   "id": "en-present-simple",
   "title": "Present Simple"
  },
  {
   "id": "en-past-simple",
   "title": "Past Simple"
  },
  {
   "id": "en-reading-cells",
   "title": "Reading: Inside the Cell"
  },
  {
   "id": "earth-layers",
   "title": "القشرة والوشاح واللب"
  },
  {
   "id": "earth-quakes",
   "title": "الزلازل"
  },
  {
   "id": "earth-water-cycle",
   "title": "دورة الماء"
  },
  {
   "id": "earth-pressure",
   "title": "الضغط الجوي"
  }
 ]
};
