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
}