"""
Central ingredient rule registry.

These rules define:
- what ingredients can be detected
- how they are categorized
- default severity levels
- keywords used for matching

This file acts as temporary seed/config data until rules
are moved into a database.
"""

INGREDIENT_RULES = {
    "peanut": {
        "display_name": "Peanut",
        "category": "allergen",
        "default_severity": "high",
        "keywords": [
            "peanut", "peanut oil", "peanut flour", "peanut butter",
            "groundnut", "arachis oil"
        ],
    },

    "tree_nuts": {
        "display_name": "Tree Nuts",
        "category": "allergen",
        "default_severity": "high",
        "keywords": [
            "almond", "cashew", "walnut", "pecan", "hazelnut",
            "pistachio", "macadamia", "brazil nut", "pine nut",
            "chestnut", "coconut", "praline", "marzipan", "nougat"
        ],
    },

    "soy": {
        "display_name": "Soy",
        "category": "allergen",
        "default_severity": "medium",
        "keywords": [
            "soy", "soybean", "soy lecithin", "soy protein",
            "soybean oil", "tofu", "edamame", "miso", "tempeh",
            "textured vegetable protein", "tvp", "hydrolyzed soy protein"
        ],
    },

    "gluten": {
        "display_name": "Gluten",
        "category": "allergen",
        "default_severity": "medium",
        "keywords": [
            "wheat", "barley", "rye", "malt", "spelt", "farro",
            "durum", "semolina", "triticale", "kamut",
            "brewer's yeast", "wheat starch", "wheat gluten"
        ],
    },

    "milk": {
        "display_name": "Milk",
        "category": "allergen",
        "default_severity": "medium",
        "keywords": [
            "milk", "whey", "casein", "caseinate", "lactose",
            "cream", "butter", "cheese", "yogurt", "ghee",
            "curds", "custard", "buttermilk", "milk powder",
            "nonfat dry milk", "skim milk", "milk solids"
        ],
    },

    "egg": {
        "display_name": "Egg",
        "category": "allergen",
        "default_severity": "medium",
        "keywords": [
            "egg", "egg white", "egg yolk", "albumin", "ovalbumin",
            "mayonnaise", "meringue", "lysozyme", "lecithin from egg"
        ],
    },

    "fish": {
        "display_name": "Fish",
        "category": "allergen",
        "default_severity": "high",
        "keywords": [
            "fish", "anchovy", "cod", "salmon", "tuna", "tilapia",
            "trout", "sardine", "haddock", "pollock", "bass",
            "catfish", "flounder", "halibut", "mahi mahi"
        ],
    },

    "shellfish": {
        "display_name": "Shellfish",
        "category": "allergen",
        "default_severity": "high",
        "keywords": [
            "shellfish", "shrimp", "crab", "lobster", "crayfish",
            "prawn", "scallop", "clam", "oyster", "mussel",
            "crawfish", "krill"
        ],
    },

    "sesame": {
        "display_name": "Sesame",
        "category": "allergen",
        "default_severity": "high",
        "keywords": [
            "sesame", "sesame seed", "sesame oil", "tahini",
            "benne", "gingelly"
        ],
    },

    "corn": {
        "display_name": "Corn",
        "category": "dietary_concern",
        "default_severity": "low",
        "keywords": [
            "corn", "corn syrup", "high fructose corn syrup",
            "corn starch", "corn flour", "corn oil", "dextrose",
            "maltodextrin", "modified corn starch"
        ],
    },

    "mustard": {
        "display_name": "Mustard",
        "category": "allergen",
        "default_severity": "medium",
        "keywords": [
            "mustard", "mustard seed", "mustard flour",
            "mustard oil", "dijon"
        ],
    },

    "added_sugars": {
        "display_name": "Added Sugars",
        "category": "dietary_concern",
        "default_severity": "low",
        "keywords": [
            "sugar", "cane sugar", "brown sugar", "corn syrup",
            "high fructose corn syrup", "fructose", "glucose",
            "dextrose", "maltose", "sucrose", "molasses",
            "honey", "agave", "maple syrup", "invert sugar"
        ],
    },

    "seed_oils": {
        "display_name": "Seed Oils",
        "category": "dietary_concern",
        "default_severity": "low",
        "keywords": [
            "canola oil", "soybean oil", "corn oil", "cottonseed oil",
            "sunflower oil", "safflower oil", "grapeseed oil",
            "rice bran oil", "vegetable oil"
        ],
    },

    "artificial_sweeteners": {
        "display_name": "Artificial Sweeteners",
        "category": "additive",
        "default_severity": "medium",
        "keywords": [
            "aspartame", "sucralose", "saccharin", "acesulfame potassium",
            "acesulfame k", "neotame", "advantame"
        ],
    },

    "artificial_colors": {
        "display_name": "Artificial Colors",
        "category": "additive",
        "default_severity": "medium",
        "keywords": [
            "red 40", "yellow 5", "yellow 6", "blue 1", "blue 2",
            "green 3", "red 3", "artificial color", "fd&c"
        ],
    },

    "preservatives": {
        "display_name": "Preservatives",
        "category": "additive",
        "default_severity": "medium",
        "keywords": [
            "sodium benzoate", "potassium sorbate", "calcium propionate",
            "sodium nitrate", "sodium nitrite", "bha", "bht",
            "tbhq", "propylene glycol"
        ],
    },

    "msg_glutamates": {
        "display_name": "MSG / Glutamates",
        "category": "additive",
        "default_severity": "medium",
        "keywords": [
            "msg", "monosodium glutamate", "autolyzed yeast extract",
            "yeast extract", "hydrolyzed vegetable protein",
            "hydrolyzed protein", "disodium guanylate",
            "disodium inosinate"
        ],
    },

    "sulfites": {
        "display_name": "Sulfites",
        "category": "additive",
        "default_severity": "medium",
        "keywords": [
            "sulfite", "sulphite", "sulfur dioxide",
            "sodium bisulfite", "sodium metabisulfite",
            "potassium bisulfite", "potassium metabisulfite"
        ],
    },
}