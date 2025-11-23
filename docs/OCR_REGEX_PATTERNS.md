# OCR Regular Expression Patterns Documentation

## Overview
This document describes all the regular expression patterns used to extract data from passport images using OCR (Optical Character Recognition).

## Pattern Naming Convention

All patterns now support **both English and French naming conventions** to facilitate identification regardless of the passport language:

- **English Aliases**: `passportNumber`, `lastName`, `firstName`, `dateBirth`, `birthPlace`, `gender`, `nationality`, `address`, `profession`, `issuingCountry`, `issuingAuthority`, `issueDate`, `expirationDate`
- **French Aliases**: `numeroPasseport`, `nom`, `prenom`, `dateNaissance`, `lieuNaissance`, `sexe`, `nationalite`, `adresse`, `profession`, `paysEmetteur`, `autoriteEmetteur`, `dateEmission`, `dateExpiration`

The system will automatically match fields regardless of whether they are in English or French.

### How It Works

The regex patterns include variations for:
1. **Full English keywords**: "Date of Birth", "Birth Date", "Place of Birth", "Issuing Country"
2. **Compound English keywords**: "datebirth", "birthdate", "birthplace", "issuingcountry"
3. **Full French keywords**: "Date de naissance", "Lieu de naissance", "Pays émetteur"
4. **Abbreviated forms**: "D.O.B.", "P.O.B.", "D.O.I.", "D.O.E."
5. **Mixed case variations**: Case-insensitive matching

### Example Matches

All these variations will be correctly identified:

**Birth Date:**
- ✅ "Date of Birth: 15/08/1990"
- ✅ "Birth Date: 15/08/1990"
- ✅ "DateBirth: 15/08/1990"
- ✅ "BirthDate: 15/08/1990"
- ✅ "D.O.B.: 15/08/1990"
- ✅ "Date de naissance: 15/08/1990"
- ✅ "Né(e) le: 15/08/1990"

**Issuing Country:**
- ✅ "Issuing Country: Democratic Republic of Congo"
- ✅ "IssuingCountry: Democratic Republic of Congo"
- ✅ "Country of Issue: Democratic Republic of Congo"
- ✅ "Pays émetteur: République Démocratique du Congo"

**First Name:**
- ✅ "Given Names: Jean-Pierre"
- ✅ "First Name: Jean-Pierre"
- ✅ "FirstName: Jean-Pierre"
- ✅ "GivenName: Jean-Pierre"
- ✅ "Prénom: Jean-Pierre"

## Supported Fields

### 1. Passport Number (numero_passeport / passportNumber)
Extracts passport numbers in various formats.

**Pattern Key**: `passportNumber` (alias: `numeroPasseport`)

**Patterns:**
- `(?:passport\s*(?:no|number|n°|num|#)[:\s]*)?([A-Z]{1,2}\d{6,9})`
- `(?:passeport\s*(?:no|n°|num|#)[:\s]*)?([A-Z]{1,2}\d{6,9})`
- `(?:passport|passeport)[:\s]*([A-Z]{1,2}\d{6,9})`
- `^([A-Z]{1,2}\d{6,9})$`
- `P<[A-Z]{3}([A-Z0-9<]+)` (MRZ format)
- `(?:document\s*(?:no|number|n°|num)[:\s]*)?([A-Z]{1,2}\d{6,9})`

**Examples:**
- Passport No: AB1234567
- Passeport N°: CD9876543
- Document #: EF5555555

### 2. Last Name (nom / lastName)
Extracts the family name/surname.

**Pattern Key**: `lastName` (alias: `nom`)

**Patterns:**
- `(?:surname|nom(?:\s*de\s*famille)?|family\s*name|last\s*name)[:\s]*([A-ZÀ-Ÿ][A-ZÀ-Ÿ\s-]+?)(?=\s*(?:postnom|pr[ée]nom|given|middle|first|$))`
- `^nom[:\s]*([A-ZÀ-Ÿ][A-ZÀ-Ÿ\s-]+)`
- `(?:name|nom)[:\s]*([A-ZÀ-Ÿ][A-ZÀ-Ÿ\s-]+?)(?=\s*(?:postnom|pr[ée]nom|given|$))`

**Examples:**
- Surname: KABILA
- Nom: TSHISEKEDI
- Family Name: MOBUTU

### 3. Middle Name (postnom / middleName)
Extracts the middle name (specific to DRC passports).

**Pattern Key**: `middleName` (alias: `postnom`)

**Patterns:**
- `(?:postnom|post-nom|middle\s*name)[:\s]*([A-ZÀ-Ÿ][A-ZÀ-Ÿ\s-]+?)(?=\s*(?:pr[ée]nom|given|first|$))`
- `^postnom[:\s]*([A-ZÀ-Ÿ][A-ZÀ-Ÿ\s-]+)`
- `(?:second\s*name)[:\s]*([A-ZÀ-Ÿ][A-ZÀ-Ÿ\s-]+)`

**Examples:**
- Postnom: DESIRE
- Middle Name: JOSEPH
- Post-nom: FELIX

### 4. First Name (prenom / firstName)
Extracts the given name(s).

**Pattern Key**: `firstName` (alias: `prenom`)

**Patterns:**
- `(?:given\s*names?|pr[ée]noms?|first\s*name)[:\s]*([A-ZÀ-Ÿ][A-Za-zÀ-ÿ\s-]+)`
- `^pr[ée]nom[:\s]*([A-ZÀ-Ÿ][A-Za-zÀ-ÿ\s-]+)`
- `(?:forename)[:\s]*([A-ZÀ-Ÿ][A-Za-zÀ-ÿ\s-]+)`

**Examples:**
- Given Names: Jean-Pierre
- Prénom: Marie
- First Name: Patrick

### 5. Date of Birth (date_naissance / dateBirth)
Extracts birth dates in multiple formats.

**Pattern Key**: `dateBirth` (aliases: `birthDate`, `dateNaissance`)

**Patterns:**
- `(?:date\s*of\s*birth|birth\s*date|date\s*de\s*naissance|d\.?o\.?b\.?|n[ée](?:\(e\))?(?:\s*le)?)[:\s]*(\d{1,2}[-\/\s]\d{1,2}[-\/\s]\d{2,4})`
- `(?:date\s*of\s*birth|birth\s*date|date\s*de\s*naissance|d\.?o\.?b\.?)[:\s]*(\d{1,2}\s+(?:JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC|JANV|FÉVR|MARS|AVR|MAI|JUIN|JUIL|AOÛT|SEPT|OCT|NOV|DÉC)\s+\d{2,4})`
- `(\d{2}(?:JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)\d{2,4})`
- `(?:born)[:\s]*(\d{1,2}[-\/\s]\d{1,2}[-\/\s]\d{2,4})`

**Supported Formats:**
- DD/MM/YYYY (15/08/1990)
- DD-MM-YYYY (15-08-1990)
- DD MMM YYYY (15 JAN 1990)
- DDMMMYYYY (15JAN1990)
- DD MOIS YYYY (15 JANVIER 1990)

### 6. Place of Birth (lieu_naissance / birthPlace)
Extracts the birthplace.

**Pattern Key**: `birthPlace` (aliases: `placeOfBirth`, `lieuNaissance`)

**Patterns:**
- `(?:place\s*of\s*birth|birth\s*place|lieu\s*de\s*naissance|p\.?o\.?b\.?|born\s*(?:in|at))[:\s]*([A-ZÀ-Ÿ][A-Za-zÀ-ÿ\s,'-]+?)(?=\s*(?:sexe|sex|nationalit|country|profession|occupation|address|$))`
- `(?:lieu)[:\s]*([A-ZÀ-Ÿ][A-Za-zÀ-ÿ\s,'-]+)`

**Examples:**
- Place of Birth: Kinshasa
- Lieu de naissance: Lubumbashi
- Born in: Goma

### 7. Gender/Sex (sexe / gender)
Extracts gender information.

**Pattern Key**: `gender` (aliases: `sex`, `sexe`)

**Patterns:**
- `(?:sex|sexe|gender)[:\s]*([MF])`
- `\b(?:sex|sexe)[:\s]*([MF])\b`
- `\b([MF])(?:\s|\/|\||$)`
- `(?:male|female|masculin|f[ée]minin)[:\s]*([MF])`

**Values:**
- M (Male/Masculin)
- F (Female/Féminin)

### 8. Nationality (nationalite / nationality)
Extracts nationality information.

**Pattern Key**: `nationality` (alias: `nationalite`)

**Patterns:**
- `(?:nationality|nationalit[ée]|citizen(?:ship)?)[:\s]*([A-ZÀ-Ÿ][A-Za-zÀ-ÿ\s'-]+?)(?=\s*(?:address|profession|occupation|passport|document|$))`
- `(?:country|pays)[:\s]*([A-ZÀ-Ÿ][A-Za-zÀ-ÿ\s'-]+?)(?=\s*(?:address|profession|$))`
- `(?:nat\.?)[:\s]*([A-ZÀ-Ÿ][A-Za-zÀ-ÿ\s'-]+)`

**Examples:**
- Nationality: Congolese
- Nationalité: Congolaise
- Citizen: Democratic Republic of Congo

### 9. Address (adresse / address) ⭐ NEW
Extracts residential address.

**Pattern Key**: `address` (alias: `adresse`)

**Patterns:**
- `(?:address|adresse|residence|domicile|residential\s*address)[:\s]*([A-ZÀ-Ÿ0-9][A-Za-zÀ-ÿ0-9\s,.'°\/-]+?)(?=\s*(?:profession|occupation|passport|document|issuing|authority|$))`
- `(?:addr\.?)[:\s]*([A-ZÀ-Ÿ0-9][A-Za-zÀ-ÿ0-9\s,.'°\/-]+)`
- `(?:street|rue|avenue|av\.?|boulevard|blvd\.?)[:\s]*([A-ZÀ-Ÿ0-9][A-Za-zÀ-ÿ0-9\s,.'°\/-]+)`

**Examples:**
- Address: 123 Avenue de la Paix, Kinshasa
- Adresse: Commune de Gombe, Kinshasa
- Residence: Avenue Kasa-Vubu

### 10. Profession/Occupation (profession / occupation) ⭐ NEW
Extracts occupation or job title.

**Pattern Key**: `profession` (alias: `occupation`)

**Patterns:**
- `(?:profession|occupation|job|emploi|m[ée]tier)[:\s]*([A-ZÀ-Ÿ][A-Za-zÀ-ÿ\s'-]+?)(?=\s*(?:address|passport|document|issuing|authority|$))`
- `(?:prof\.?|occup\.?)[:\s]*([A-ZÀ-Ÿ][A-Za-zÀ-ÿ\s'-]+)`
- `(?:title|titre)[:\s]*([A-ZÀ-Ÿ][A-Za-zÀ-ÿ\s'-]+)`

**Examples:**
- Profession: Engineer
- Occupation: Teacher
- Métier: Médecin
- Job: Business Manager

### 11. Issuing Country (pays_emetteur / issuingCountry)
Extracts the country that issued the passport.

**Pattern Key**: `issuingCountry` (alias: `paysEmetteur`)

**Patterns:**
- `(?:issuing\s*country|pays\s*[ée]metteur|country\s*of\s*issue|issued\s*by\s*country)[:\s]*([A-ZÀ-Ÿ][A-Za-zÀ-ÿ\s'-]+)`
- `(?:issuing\s*state|[ée]tat\s*[ée]metteur)[:\s]*([A-ZÀ-Ÿ][A-Za-zÀ-ÿ\s'-]+)`
- `P<([A-Z]{3})` (MRZ format - 3-letter country code)
- `(?:code\s*pays)[:\s]*([A-Z]{3})`

**Examples:**
- Issuing Country: Democratic Republic of Congo
- Pays émetteur: République Démocratique du Congo
- P<COD (MRZ format)

### 12. Issuing Authority (autorite_emetteur / issuingAuthority)
Extracts the authority that issued the passport.

**Pattern Key**: `issuingAuthority` (alias: `autoriteEmetteur`)

**Patterns:**
- `(?:authority|autorit[ée]|issuing\s*authority|autorit[ée]\s*d'?[ée]mission)[:\s]*([A-ZÀ-Ÿ][A-Za-zÀ-ÿ\s,.'°-]+?)(?=\s*(?:date|passport|document|$))`
- `(?:issued\s*by|[ée]mis\s*par|delivered\s*by|d[ée]livr[ée]\s*par)[:\s]*([A-ZÀ-Ÿ][A-Za-zÀ-ÿ\s,.'°-]+)`
- `(?:auth\.?)[:\s]*([A-ZÀ-Ÿ][A-Za-zÀ-ÿ\s,.'°-]+)`

**Examples:**
- Authority: Direction Générale de Migration
- Issued by: Ministry of Foreign Affairs
- Autorité: DGM Kinshasa

### 13. Issue Date (date_emission / issueDate)
Extracts the date when the passport was issued.

**Pattern Key**: `issueDate` (alias: `dateEmission`)

**Patterns:**
- `(?:date\s*of\s*issue|issue\s*date|date\s*d'?[ée]mission|issued|[ée]mis|d\.?o\.?i\.?)[:\s]*(\d{1,2}[-\/\s]\d{1,2}[-\/\s]\d{2,4})`
- `(?:date\s*of\s*issue)[:\s]*(\d{1,2}\s+(?:JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)\s+\d{2,4})`

**Examples:**
- Date of Issue: 15/01/2020
- Issued: 15 JAN 2020

### 14. Expiration Date (date_expiration / expirationDate)
Extracts the passport expiration date.

**Pattern Key**: `expirationDate` (aliases: `expiryDate`, `dateExpiration`)

**Patterns:**
- `(?:date\s*of\s*expiry|expiry\s*date|date\s*d'?expiration|expires|expire|valid\s*until|valable\s*jusqu'?[àa]|d\.?o\.?e\.?)[:\s]*(\d{1,2}[-\/\s]\d{1,2}[-\/\s]\d{2,4})`
- `(?:date\s*of\s*expiry)[:\s]*(\d{1,2}\s+(?:JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)\s+\d{2,4})`

**Examples:**
- Date of Expiry: 14/01/2030
- Expires: 14 JAN 2030
- Valid until: 14/01/2030

## Machine Readable Zone (MRZ)

The MRZ is the two or three lines of text at the bottom of passports containing machine-readable data.

**Pattern:**
```
P<[COUNTRY_CODE][SURNAME]<<[GIVEN_NAMES]
[PASSPORT_NUMBER][CHECK][NATIONALITY][DOB][CHECK][SEX][EXPIRY][CHECK]...
```

**Example:**
```
P<CODKABILA<<JOSEPH<DESIRE<<<<<<<<<<<<<<<<<
AB1234567<9COD8901011M2512314<<<<<<<<<<<<<<<8
```

## Special Features

### 1. Congolese Name Parsing
The system intelligently handles Congolese naming conventions (Last Name, Middle Name, First Name) by:
- Analyzing the MRZ structure
- Detecting uppercase patterns for middle names
- Separating compound names properly

### 2. Date Normalization
All dates are normalized to `YYYY-MM-DD` format regardless of input format.

### 3. Text Capitalization
Names and places are automatically capitalized:
- Last names → UPPERCASE
- Middle names → UPPERCASE
- First names → Title Case
- Places → Title Case

### 4. Country Code Conversion
Three-letter ISO country codes (e.g., COD, FRA, USA) are automatically converted to full country names.

## Supported Languages

- **English**: Full support for English passport formats
- **French**: Full support for French passport formats (common in DRC)
- Both languages can be mixed in the same document

## Error Handling

The system includes:
- Multiple pattern variations per field to increase accuracy
- Minimum length validation for text fields
- Date format validation and normalization
- Fallback patterns when primary patterns fail

## Usage in Code

```typescript
// Example: Extract data from OCR text
const extractedText = await ocrService.extractTextFromImage(imageFile);
const passportData = passportOcrService.parsePassportText(extractedText.text);

// passportData now contains:
// {
//   nom: "KABILA",
//   postnom: "DESIRE",
//   prenom: "Joseph",
//   date_naissance: "1990-08-15",
//   lieu_naissance: "Kinshasa",
//   sexe: "M",
//   nationalite: "Congolaise",
//   adresse: "Avenue de la Paix, Kinshasa",
//   profession: "Engineer",
//   numero_passeport: "AB1234567",
//   pays_emetteur: "République Démocratique du Congo",
//   autorite_emetteur: "DGM Kinshasa"
// }
```

## Performance Tips

1. **Image Quality**: Use high-resolution, well-lit images for best results
2. **Image Orientation**: Ensure passport is properly aligned and not skewed
3. **Clean Background**: Use a contrasting, clean background
4. **Focus**: Ensure all text is in focus

## Updates

**Version 2.1** (Current)
- ✅ Added bilingual pattern naming (English/French aliases)
- ✅ Enhanced pattern matching with compound keywords (e.g., `datebirth`, `birthdate`, `issuingcountry`)
- ✅ Added support for concatenated English keywords without spaces
- ✅ Improved compatibility with fully English passport documents
- ✅ All pattern keys now use English names with French aliases

**Version 2.0**
- ✅ Added Address (adresse) field extraction
- ✅ Added Profession (profession) field extraction
- ✅ Enhanced all existing patterns with more variations
- ✅ Added support for abbreviated keywords (D.O.B., P.O.B., etc.)
- ✅ Improved bilingual support (English/French)
- ✅ Better handling of special characters in addresses
- ✅ Translated all code comments to English

**Version 1.0**
- Initial implementation with 12 fields
- Basic MRZ support
- Congolese name parsing

## Contributing

To add new patterns or improve existing ones:
1. Update the `patterns` object in `passport-ocr.service.ts`
2. Test with various passport formats
3. Document new patterns in this file
4. Update the `IIdentite` interface if adding new fields

## References

- [ICAO Doc 9303](https://www.icao.int/publications/pages/publication.aspx?docnum=9303): Machine Readable Travel Documents
- ISO 3166-1 alpha-3: Country codes
- ISO/IEC 7501: Identification cards
