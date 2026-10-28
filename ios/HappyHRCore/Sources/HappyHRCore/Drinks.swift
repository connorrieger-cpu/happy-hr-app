import Foundation

// Drink types for search: Beer, Wine, Cocktails, Tequila & mezcal, Shots, Bubbly & spritz.
// A special can be more than one ("margaritas" are cocktails and tequila). A venue serves a
// type when one of its drink specials is that type, or when it's that kind of place.
// A port of src/lib/drinks.ts.

public enum DrinkType: String, Codable, CaseIterable, Hashable, Sendable {
    case beer, wine, cocktail, tequila, shot, bubbly

    public var label: String {
        switch self {
        case .beer: "Beer"
        case .wine: "Wine"
        case .cocktail: "Cocktails"
        case .tequila: "Tequila & mezcal"
        case .shot: "Shots"
        case .bubbly: "Bubbly & spritz"
        }
    }

    public var emoji: String {
        switch self {
        case .beer: "🍺"
        case .wine: "🍷"
        case .cocktail: "🍸"
        case .tequila: "🌵"
        case .shot: "🥃"
        case .bubbly: "🥂"
        }
    }

    /// Copied character for character from drinks.ts (`WORDS`).
    fileprivate var words: JSRegex {
        switch self {
        case .beer:
            jsRegex(
                #"\b(beers?|pints?|lagers?|ipas?|ales?|drafts?|draughts?|cans?|tall ?cans?|tallboys?|pilsners?|stouts?|ciders?|pitchers?|buckets?|schooners?|sleeman|budweiser|bud light|coors|canadian|corona|modelo|stella|heineken|peroni|guinness|sapporo|asahi|kronenbourg|michelob|moosehead|pbr|beau s|burdock|creemore|wellington)\b"#
            )
        case .wine: jsRegex(#"\b(wines?|vino|rose|vqa|sangria|pinot|merlot|cabernet|chardonnay|sauvignon|riesling|malbec|sommelier)\b"#)
        case .cocktail:
            jsRegex(
                #"\b(cocktails?|martinis?|negronis?|old fashioneds?|mojitos?|caesars?|highballs?|mules?|margaritas?|margs?|palomas?|sangria|spritz(es)?|mimosas?|bellinis?|daiquiris?|sours?|mixed drinks?|rail drinks?|bar rail|aperitivo)\b"#
            )
        case .tequila: jsRegex(#"\b(tequilas?|mezcals?|margaritas?|margs?|palomas?|mezcalitas?|patron|don julio|casamigos|el jimador|hornitos|jose cuervo)\b"#)
        case .shot: jsRegex(#"\b(shots?|shooters?|jager|jagerbombs?)\b"#)
        case .bubbly: jsRegex(#"\b(bubbly|bubbles|prosecco|cava|champagne|sparkling|spritz(es)?|mimosas?|bellinis?|aperol|hugo)\b"#)
        }
    }

    /// What kind of place pours what (drinks.ts `PLACE`).
    fileprivate var place: JSRegex? {
        switch self {
        case .beer: jsRegex(#"\b(brew\w*|beer|taproom|tap room|pub|tavern|alehouse|gastropub|beer hall|beer garden)\b"#)
        case .wine: jsRegex(#"\b(wine|enoteca|vino)\b"#)
        case .cocktail: jsRegex(#"\b(cocktails?|lounge|speakeasy|mixology)\b"#)
        case .tequila: jsRegex(#"\b(tequila|mezcal|cantina)\b"#)
        case .shot, .bubbly: nil
        }
    }
}

/// Lowercase, accents and curly apostrophes gone, so "rosé" and "rose" read the same.
private func plain(_ text: String) -> String {
    let stripped = String(String.UnicodeScalarView(text.decomposedStringWithCanonicalMapping.unicodeScalars.filter { $0.properties.generalCategory != .nonspacingMark }))
    return stripped.lowercased().replacingOccurrences(of: "’", with: " ").replacingOccurrences(of: "'", with: " ")
}

/// Every drink type a special is, in list order (none for food).
public func drinkTypesOf(_ special: Special) -> [DrinkType] {
    guard special.kind == .drink else { return [] }
    let item = plain(special.item)
    return DrinkType.allCases.filter { $0.words.matches(item) }
}

/// The first drink special of this type, if any.
public func drinkSpecial(_ venue: Venue, _ type: DrinkType) -> SpecialRef? {
    allSpecials(venue).first { drinkTypesOf($0.special).contains(type) }
}

public func servesDrink(_ venue: Venue, _ type: DrinkType) -> Bool {
    if drinkSpecial(venue, type) != nil { return true }
    if type == .beer && venue.vibe == .brewery { return true }
    if type == .wine && venue.vibe == .wine { return true }
    if type == .cocktail && venue.vibe == .cocktails { return true }
    return type.place?.matches(plain(venue.category)) ?? false
}
