"""
Ingredient detection rules for the analyzer engine.

Each category contains ingredient keywords that may indicate:
- allergens
- dietary concerns
- additives
- preservatives
- artificial ingredients

The analyzer checks parsed ingredient text against these keywords
to generate warnings and classifications.
"""

INGREDIENT_RULES = {

    # -------------------------
    # Major Allergens
    # -------------------------

    "peanut": [
        "peanut",
        "peanut oil",
        "peanut flour",
        "peanut butter",
        "groundnut",
        "arachis oil"
    ],

    "tree nuts": [
        "almond",
        "cashew",
        "walnut",
        "pecan",
        "hazelnut",
        "pistachio",
        "macadamia",
        "brazil nut",
        "pine nut",
        "chestnut",
        "coconut",
        "praline",
        "marzipan",
        "nougat"
    ],

    "soy": [
        "soy",
        "soybean",
        "soy lecithin",
        "soy protein",
        "soybean oil",
        "tofu",
        "edamame",
        "miso",
        "tempeh",
        "textured vegetable protein",
        "tvp",
        "hydrolyzed soy protein"
    ],

    "gluten": [
        "wheat",
        "barley",
        "rye",
        "malt",
        "spelt",
        "farro",
        "durum",
        "semolina",
        "triticale",
        "kamut",
        "brewer's yeast",
        "wheat starch",
        "wheat gluten"
    ],

    "milk": [
        "milk",
        "whey",
        "casein",
        "caseinate",
        "lactose",
        "cream",
        "butter",
        "cheese",
        "yogurt",
        "ghee",
        "curds",
        "custard",
        "buttermilk",
        "milk powder",
        "nonfat dry milk",
        "skim milk",
        "milk solids"
    ],

    "egg": [
        "egg",
        "egg white",
        "egg yolk",
        "albumin",
        "ovalbumin",
        "mayonnaise",
        "meringue",
        "lysozyme",
        "lecithin from egg"
    ],

    "fish": [
        "fish",
        "anchovy",
        "cod",
        "salmon",
        "tuna",
        "tilapia",
        "trout",
        "sardine",
        "haddock",
        "pollock",
        "bass",
        "catfish",
        "flounder",
        "halibut",
        "mahi mahi"
    ],

    "shellfish": [
        "shellfish",
        "shrimp",
        "crab",
        "lobster",
        "crayfish",
        "prawn",
        "scallop",
        "clam",
        "oyster",
        "mussel",
        "crawfish",
        "krill"
    ],

    "sesame": [
        "sesame",
        "sesame seed",
        "sesame oil",
        "tahini",
        "benne",
        "gingelly"
    ],

    # -------------------------
    # Dietary Concerns
    # -------------------------

    "corn": [
        "corn",
        "corn syrup",
        "high fructose corn syrup",
        "corn starch",
        "corn flour",
        "corn oil",
        "dextrose",
        "maltodextrin",
        "modified corn starch"
    ],

    "mustard": [
        "mustard",
        "mustard seed",
        "mustard flour",
        "mustard oil",
        "dijon"
    ],

    "added sugars": [
        "sugar",
        "cane sugar",
        "brown sugar",
        "corn syrup",
        "high fructose corn syrup",
        "fructose",
        "glucose",
        "dextrose",
        "maltose",
        "sucrose",
        "molasses",
        "honey",
        "agave",
        "maple syrup",
        "invert sugar"
    ],

    "seed oils": [
        "canola oil",
        "soybean oil",
        "corn oil",
        "cottonseed oil",
        "sunflower oil",
        "safflower oil",
        "grapeseed oil",
        "rice bran oil",
        "vegetable oil"
    ],

    # -------------------------
    # Additives / Preservatives
    # -------------------------

    "artificial sweeteners": [
        "aspartame",
        "sucralose",
        "saccharin",
        "acesulfame potassium",
        "acesulfame k",
        "neotame",
        "advantame"
    ],

    "artificial colors": [
        "red 40",
        "yellow 5",
        "yellow 6",
        "blue 1",
        "blue 2",
        "green 3",
        "red 3",
        "artificial color",
        "fd&c"
    ],

    "preservatives": [
        "sodium benzoate",
        "potassium sorbate",
        "calcium propionate",
        "sodium nitrate",
        "sodium nitrite",
        "bha",
        "bht",
        "tbhq",
        "propylene glycol"
    ],

    "msg / glutamates": [
        "msg",
        "monosodium glutamate",
        "autolyzed yeast extract",
        "yeast extract",
        "hydrolyzed vegetable protein",
        "hydrolyzed protein",
        "disodium guanylate",
        "disodium inosinate"
    ],

    "sulfites": [
        "sulfite",
        "sulphite",
        "sulfur dioxide",
        "sodium bisulfite",
        "sodium metabisulfite",
        "potassium bisulfite",
        "potassium metabisulfite"
    ]
}