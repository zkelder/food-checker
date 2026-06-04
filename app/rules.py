"""
Central ingredient rule registry.

Temporary seed/config data until ingredient rules move into a database.
"""

INGREDIENT_RULES = {
    "peanut": {
        "display_name": "Peanut",
        "category": "allergen",
        "default_severity": "high",
        "keywords": [
            "peanut", "peanuts", "peanut oil", "peanut flour", "peanut butter",
            "peanut protein", "groundnut", "groundnuts", "arachis oil",
            "beer nuts", "goober", "mandelonas",
        ],
    },

    "tree_nuts": {
        "display_name": "Tree Nuts",
        "category": "allergen",
        "default_severity": "high",
        "keywords": [
            "almond", "almonds", "cashew", "cashews", "walnut", "walnuts",
            "pecan", "pecans", "hazelnut", "hazelnuts", "filbert",
            "filberts", "pistachio", "pistachios", "macadamia",
            "macadamia nut", "brazil nut", "pine nut", "pignoli",
            "chestnut", "praline", "marzipan", "nougat", "nut butter",
            "nut flour", "nut meal",
        ],
    },

    "soy": {
        "display_name": "Soy",
        "category": "allergen",
        "default_severity": "medium",
        "keywords": [
            "soy", "soya", "soybean", "soybeans", "soy lecithin",
            "soy protein", "soy protein isolate", "soy protein concentrate",
            "soybean oil", "soy flour", "soy sauce", "tamari", "tofu",
            "edamame", "miso", "tempeh", "natto", "textured vegetable protein",
            "tvp", "hydrolyzed soy protein", "vegetable protein",
        ],
    },

    "gluten": {
        "display_name": "Gluten",
        "category": "allergen",
        "default_severity": "medium",
        "keywords": [
            "wheat", "wheat flour", "whole wheat", "wheat starch",
            "wheat gluten", "barley", "barley malt", "rye", "malt",
            "malt extract", "malt flavoring", "malt vinegar", "spelt",
            "farro", "durum", "semolina", "triticale", "kamut",
            "einkorn", "emmer", "bulgur", "couscous", "seitan",
            "brewer's yeast", "modified wheat starch",
        ],
    },

    "milk": {
        "display_name": "Milk",
        "category": "allergen",
        "default_severity": "medium",
        "keywords": [
            "milk", "whey", "whey protein", "whey powder", "casein",
            "caseinate", "sodium caseinate", "calcium caseinate",
            "lactose", "lactalbumin", "lactoglobulin", "cream", "butter",
            "butterfat", "buttermilk", "cheese", "yogurt", "yoghurt",
            "ghee", "curds", "custard", "milk powder", "dry milk",
            "nonfat dry milk", "skim milk", "milk solids", "milkfat",
            "condensed milk", "evaporated milk",
        ],
    },

    "egg": {
        "display_name": "Egg",
        "category": "allergen",
        "default_severity": "medium",
        "keywords": [
            "egg", "eggs", "egg white", "egg yolk", "albumin", "albumen",
            "ovalbumin", "ovoglobulin", "ovomucin", "ovomucoid",
            "ovotransferrin", "mayonnaise", "mayo", "meringue",
            "lysozyme", "lecithin from egg",
        ],
    },

    "fish": {
        "display_name": "Fish",
        "category": "allergen",
        "default_severity": "high",
        "keywords": [
            "fish", "anchovy", "anchovies", "cod", "salmon", "tuna",
            "tilapia", "trout", "sardine", "sardines", "haddock",
            "pollock", "bass", "catfish", "flounder", "halibut",
            "mahi mahi", "snapper", "grouper", "sole", "mackerel",
            "herring", "fish sauce", "worcestershire sauce", "surimi",
        ],
    },

    "shellfish": {
        "display_name": "Shellfish",
        "category": "allergen",
        "default_severity": "high",
        "keywords": [
            "shellfish", "shrimp", "crab", "lobster", "crayfish",
            "crawfish", "prawn", "prawns", "scallop", "scallops",
            "clam", "clams", "oyster", "oysters", "mussel", "mussels",
            "krill", "langostino", "abalone", "conch", "mollusk",
            "mollusks", "crustacean", "crustaceans",
        ],
    },

    "sesame": {
        "display_name": "Sesame",
        "category": "allergen",
        "default_severity": "high",
        "keywords": [
            "sesame", "sesame seed", "sesame seeds", "sesame oil",
            "tahini", "benne", "benne seed", "gingelly", "til",
            "sesamol", "sesamum indicum",
        ],
    },

    "corn": {
        "display_name": "Corn",
        "category": "dietary_concern",
        "default_severity": "low",
        "keywords": [
            "corn", "cornmeal", "corn flour", "corn starch", "cornstarch",
            "modified corn starch", "corn syrup", "high fructose corn syrup",
            "hfcs", "corn oil", "maize", "dextrose", "maltodextrin",
            "polenta", "hominy", "masa", "masa harina",
        ],
    },

    "mustard": {
        "display_name": "Mustard",
        "category": "allergen",
        "default_severity": "medium",
        "keywords": [
            "mustard", "mustard seed", "mustard flour", "mustard powder",
            "mustard oil", "dijon", "yellow mustard", "brown mustard",
        ],
    },

    "added_sugars": {
        "display_name": "Added Sugars",
        "category": "dietary_concern",
        "default_severity": "low",
        "keywords": [
            "sugar", "cane sugar", "beet sugar", "brown sugar",
            "raw sugar", "turbinado sugar", "powdered sugar",
            "confectioners sugar", "corn syrup", "high fructose corn syrup",
            "hfcs", "fructose", "glucose", "dextrose", "maltose",
            "sucrose", "galactose", "molasses", "honey", "agave",
            "agave nectar", "maple syrup", "invert sugar", "cane juice",
            "evaporated cane juice", "fruit juice concentrate",
            "brown rice syrup", "rice syrup", "barley malt syrup",
            "caramel", "caramel syrup",
        ],
    },

    "seed_oils": {
        "display_name": "Seed Oils",
        "category": "dietary_concern",
        "default_severity": "low",
        "keywords": [
            "canola oil", "rapeseed oil", "soybean oil", "corn oil",
            "cottonseed oil", "sunflower oil", "safflower oil",
            "grapeseed oil", "rice bran oil", "vegetable oil",
            "sesame oil", "peanut oil",
        ],
    },

    "artificial_sweeteners": {
        "display_name": "Artificial Sweeteners",
        "category": "additive",
        "default_severity": "medium",
        "keywords": [
            "aspartame", "sucralose", "splenda", "saccharin",
            "sweet'n low", "acesulfame potassium", "acesulfame k",
            "ace-k", "neotame", "advantame", "cyclamate",
        ],
    },

    "sugar_alcohols": {
        "display_name": "Sugar Alcohols",
        "category": "additive",
        "default_severity": "low",
        "keywords": [
            "sorbitol", "xylitol", "erythritol", "maltitol",
            "mannitol", "isomalt", "lactitol", "hydrogenated starch hydrolysates",
        ],
    },

    "artificial_colors": {
        "display_name": "Artificial Colors",
        "category": "additive",
        "default_severity": "medium",
        "keywords": [
            "red 40", "red no. 40", "fd&c red 40", "yellow 5",
            "yellow no. 5", "tartrazine", "yellow 6", "sunset yellow",
            "blue 1", "brilliant blue", "blue 2", "indigo carmine",
            "green 3", "fast green", "red 3", "erythrosine",
            "artificial color", "artificial colors", "fd&c",
        ],
    },

    "preservatives": {
        "display_name": "Preservatives",
        "category": "additive",
        "default_severity": "medium",
        "keywords": [
            "sodium benzoate", "potassium benzoate", "benzoic acid",
            "potassium sorbate", "sorbic acid", "calcium propionate",
            "sodium propionate", "sodium nitrate", "sodium nitrite",
            "potassium nitrate", "potassium nitrite", "bha", "bht",
            "tbhq", "propylene glycol", "calcium disodium edta",
            "disodium edta",
        ],
    },

    "msg_glutamates": {
        "display_name": "MSG / Glutamates",
        "category": "additive",
        "default_severity": "medium",
        "keywords": [
            "msg", "monosodium glutamate", "glutamate",
            "autolyzed yeast extract", "yeast extract",
            "hydrolyzed vegetable protein", "hydrolyzed soy protein",
            "hydrolyzed protein", "hydrolyzed corn protein",
            "disodium guanylate", "disodium inosinate",
            "natural flavor", "natural flavors",
        ],
    },

    "sulfites": {
        "display_name": "Sulfites",
        "category": "additive",
        "default_severity": "medium",
        "keywords": [
            "sulfite", "sulfites", "sulphite", "sulphites",
            "sulfur dioxide", "sulphur dioxide", "sodium bisulfite",
            "sodium metabisulfite", "potassium bisulfite",
            "potassium metabisulfite", "sodium sulfite",
            "potassium sulfite",
        ],
    },

    "caffeine": {
        "display_name": "Caffeine",
        "category": "dietary_concern",
        "default_severity": "low",
        "keywords": [
            "caffeine", "coffee extract", "green tea extract",
            "guarana", "yerba mate", "kola nut",
        ],
    },

    "alcohol_ingredients": {
        "display_name": "Alcohol Ingredients",
        "category": "dietary_concern",
        "default_severity": "medium",
        "keywords": [
            "alcohol", "ethanol", "beer", "wine", "rum", "brandy",
            "bourbon", "whiskey", "vodka", "liqueur",
        ],
    },

    "pork": {
        "display_name": "Pork",
        "category": "dietary_restriction",
        "default_severity": "medium",
        "keywords": [
            "pork", "bacon", "ham", "lard", "prosciutto", "pepperoni",
            "salami", "gelatin", "pork gelatin", "porcine",
        ],
    },

    "beef": {
        "display_name": "Beef",
        "category": "dietary_restriction",
        "default_severity": "medium",
        "keywords": [
            "beef", "beef fat", "tallow", "beef gelatin", "bovine",
            "beef stock", "beef broth",
        ],
    },

    "animal_derivatives": {
        "display_name": "Animal Derivatives",
        "category": "dietary_restriction",
        "default_severity": "medium",
        "keywords": [
            "gelatin", "collagen", "rennet", "animal rennet",
            "lard", "tallow", "bone char", "isinglass",
            "carmine", "cochineal", "shellac", "confectioner's glaze",
        ],
    },

    "high_sodium": {
        "display_name": "High Sodium Ingredients",
        "category": "dietary_concern",
        "default_severity": "low",
        "keywords": [
            "salt", "sea salt", "sodium chloride", "monosodium glutamate",
            "sodium bicarbonate", "baking soda", "sodium phosphate",
            "disodium phosphate", "trisodium phosphate", "sodium benzoate",
            "sodium nitrate", "sodium nitrite",
        ],
    },

    "gums_thickeners": {
        "display_name": "Gums / Thickeners",
        "category": "additive",
        "default_severity": "low",
        "keywords": [
            "carrageenan", "xanthan gum", "guar gum", "locust bean gum",
            "gellan gum", "cellulose gum", "carboxymethylcellulose",
        ],
    },
}


RULE_DETAILS = {
    "peanut": {
        "description": "Peanut terms may indicate a peanut-derived ingredient.",
        "aliases": ["goobers", "arachis", "ground nut", "ground nuts"],
    },
    "tree_nuts": {
        "description": "Tree nut terms may indicate almond, walnut, cashew, or related nut ingredients.",
        "aliases": [
            "almond butter", "almond flour", "walnut oil", "cashew butter",
            "pecan meal", "hazelnut spread", "pistachio paste",
            "macadamia nuts",
        ],
    },
    "soy": {
        "description": "Soy terms may indicate soy-derived protein, lecithin, beans, or fermented soy ingredients.",
        "aliases": [
            "soy bean", "soy beans", "soybean lecithin", "soya lecithin",
            "edamame beans", "soy isolate", "soy protein isolate",
            "soy protein concentrate",
        ],
    },
    "gluten": {
        "label": "Gluten / Wheat",
        "description": "Wheat, barley, rye, malt, and related grain terms may indicate gluten or wheat concerns.",
        "aliases": [
            "wheat berries", "wheat bran", "wheat germ", "enriched wheat flour",
            "unbleached wheat flour", "durum wheat", "semolina flour",
            "malted barley", "malt syrup", "malt powder", "spelt flour",
            "rye flour", "barley flour",
        ],
    },
    "milk": {
        "label": "Milk / Dairy",
        "description": "Milk and dairy terms may indicate ingredients commonly associated with dairy.",
        "aliases": [
            "dairy", "dairy solids", "milk protein", "whey isolate",
            "whey protein isolate", "caseinates", "butter oil",
            "cream powder", "cheese powder",
        ],
    },
    "egg": {
        "description": "Egg terms may indicate egg-derived ingredients such as whites, yolks, albumin, or mayonnaise.",
        "aliases": [
            "egg whites", "egg white powder", "egg yolks", "dried egg",
            "whole egg", "whole eggs", "albumen powder",
        ],
    },
    "fish": {
        "description": "Fish terms may indicate fish-derived ingredients or sauces.",
        "aliases": ["fish oil", "fish gelatin", "anchovy paste"],
    },
    "shellfish": {
        "description": "Shellfish terms may indicate crustacean or mollusk ingredients.",
        "aliases": ["shrimp paste", "crab extract", "lobster stock"],
    },
    "sesame": {
        "description": "Sesame terms may indicate sesame seed, oil, or tahini ingredients.",
        "aliases": ["sesame paste", "sesame flour"],
    },
    "corn": {
        "description": "Corn terms may indicate corn-derived sweeteners, starches, oils, or flours.",
        "aliases": ["corn sugar", "glucose syrup", "modified food starch"],
    },
    "mustard": {
        "description": "Mustard terms may indicate mustard seed, flour, powder, or oil.",
        "aliases": ["mustard extract", "mustard flavor"],
    },
    "added_sugars": {
        "description": "Sugar terms may indicate added sweeteners or concentrated sweetening ingredients.",
        "aliases": ["cane syrup", "date syrup", "coconut sugar", "fruit syrup"],
    },
    "seed_oils": {
        "description": "Seed oil terms may indicate extracted seed or vegetable oils.",
        "aliases": ["soy oil", "soya oil", "high oleic sunflower oil"],
    },
    "artificial_sweeteners": {
        "description": "Artificial sweetener terms may indicate non-sugar sweetening additives.",
        "aliases": ["acesulfame-potassium", "acesulfame k", "aspartame-acesulfame"],
    },
    "sugar_alcohols": {
        "description": "Sugar alcohol terms may indicate polyol sweeteners.",
        "aliases": ["polyols", "hydrogenated starch hydrolysate"],
    },
    "artificial_colors": {
        "description": "Artificial color terms may indicate FD&C color additives.",
        "aliases": [
            "red #40", "fdc red 40", "fd c red 40", "allura red",
            "yellow #5", "fd c yellow 5", "fdc yellow 5",
            "blue #1", "fd c blue 1", "fdc blue 1",
        ],
    },
    "preservatives": {
        "description": "Preservative terms may indicate additives commonly used to slow spoilage or oxidation.",
        "aliases": ["benzoate", "sorbate", "propionate", "sodium erythorbate"],
    },
    "msg_glutamates": {
        "description": "MSG and glutamate terms may indicate ingredients commonly associated with glutamate additives.",
        "aliases": ["monosodium-glutamate", "free glutamate", "hydrolysed vegetable protein"],
    },
    "sulfites": {
        "description": "Sulfite terms may indicate sulfite preservatives.",
        "aliases": ["sulfur dioxide preservative", "sulphur dioxide preservative"],
    },
    "caffeine": {
        "description": "Caffeine terms may indicate caffeine-containing ingredients.",
        "aliases": ["coffee powder", "tea extract", "cocoa extract"],
    },
    "alcohol_ingredients": {
        "description": "Alcohol terms may indicate alcohol-derived ingredients.",
        "aliases": ["ethyl alcohol", "cooking wine"],
    },
    "pork": {
        "description": "Pork terms may indicate pork-derived ingredients.",
        "aliases": ["porcine gelatin", "pork fat"],
    },
    "beef": {
        "description": "Beef terms may indicate beef-derived ingredients.",
        "aliases": ["bovine gelatin", "beef extract"],
    },
    "animal_derivatives": {
        "description": "Animal derivative terms may indicate animal-derived processing or ingredient sources.",
        "aliases": ["animal gelatin", "cochineal extract", "confectioners glaze"],
    },
    "high_sodium": {
        "description": "Sodium terms may indicate ingredients commonly associated with higher sodium content.",
        "aliases": ["sodium citrate", "sodium acid pyrophosphate"],
    },
    "gums_thickeners": {
        "description": "Gum and thickener terms may indicate texture or stabilizing additives.",
        "aliases": ["irish moss", "e407"],
    },
}


for rule_id, rule in INGREDIENT_RULES.items():
    details = RULE_DETAILS.get(rule_id, {})
    label = details.get("label", rule.get("display_name", rule_id))
    severity = rule.get("default_severity", rule.get("severity", "info"))
    description = details.get(
        "description",
        f"{label} may indicate a potential ingredient concern.",
    )

    rule["id"] = rule_id
    rule["label"] = label
    rule["display_name"] = label
    rule["severity"] = severity
    rule["default_severity"] = severity
    rule["description"] = description
    rule["warning"] = description
    rule["aliases"] = details.get("aliases", [])
