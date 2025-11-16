# OCR Pattern Matching Test Examples

This document provides test examples to verify the OCR pattern matching capabilities for both English and French passport formats.

## Test Case 1: Full English Passport

### Input Text:
```
PASSPORT
United States of America

Passport Number: AB1234567
Surname: JOHNSON
Given Names: Michael David
Date of Birth: 15/08/1985
Place of Birth: New York City
Sex: M
Nationality: American
Address: 123 Main Street, Manhattan, NY 10001
Occupation: Software Engineer
Issuing Country: United States of America
Authority: U.S. Department of State
Date of Issue: 01/01/2020
Date of Expiry: 31/12/2029
```

### Expected Extraction:
- ✅ Passport Number: `AB1234567`
- ✅ Last Name: `JOHNSON`
- ✅ First Name: `Michael David`
- ✅ Date of Birth: `1985-08-15`
- ✅ Place of Birth: `New York City`
- ✅ Gender: `M`
- ✅ Nationality: `American`
- ✅ Address: `123 Main Street, Manhattan, Ny 10001`
- ✅ Profession: `Software Engineer`
- ✅ Issuing Country: `United States Of America`
- ✅ Issuing Authority: `U.s. Department Of State`
- ✅ Issue Date: `2020-01-01`
- ✅ Expiration Date: `2029-12-31`

---

## Test Case 2: Full French Passport (DRC)

### Input Text:
```
PASSEPORT
République Démocratique du Congo

Numéro de passeport: CD9876543
Nom: KABILA
Postnom: DESIRE
Prénom: Joseph
Date de naissance: 12/06/1980
Lieu de naissance: Lubumbashi
Sexe: M
Nationalité: Congolaise
Adresse: Avenue de la Liberation, Commune de Gombe, Kinshasa
Profession: Ingénieur Civil
Pays émetteur: République Démocratique du Congo
Autorité: Direction Générale de Migration
Date d'émission: 15/03/2021
Date d'expiration: 14/03/2031
```

### Expected Extraction:
- ✅ Passport Number: `CD9876543`
- ✅ Last Name: `KABILA`
- ✅ Middle Name: `DESIRE`
- ✅ First Name: `Joseph`
- ✅ Date of Birth: `1980-06-12`
- ✅ Place of Birth: `Lubumbashi`
- ✅ Gender: `M`
- ✅ Nationality: `Congolaise`
- ✅ Address: `Avenue De La Liberation, Commune De Gombe, Kinshasa`
- ✅ Profession: `Ingénieur Civil`
- ✅ Issuing Country: `République Démocratique Du Congo`
- ✅ Issuing Authority: `Direction Générale De Migration`
- ✅ Issue Date: `2021-03-15`
- ✅ Expiration Date: `2031-03-14`

---

## Test Case 3: Compact English Format

### Input Text:
```
PASSPORT USA
PassportNumber: EF5555555
LastName: SMITH
MiddleName: JAMES
FirstName: Sarah
DateBirth: 22/11/1992
BirthPlace: Los Angeles
Gender: F
Nationality: American
Address: 456 Oak Avenue, California
Occupation: Doctor
IssuingCountry: USA
IssuingAuthority: Department of State
IssueDate: 10/05/2022
ExpirationDate: 09/05/2032
```

### Expected Extraction:
- ✅ Passport Number: `EF5555555`
- ✅ Last Name: `SMITH`
- ✅ Middle Name: `JAMES`
- ✅ First Name: `Sarah`
- ✅ Date of Birth: `1992-11-22`
- ✅ Place of Birth: `Los Angeles`
- ✅ Gender: `F`
- ✅ Nationality: `American`
- ✅ Address: `456 Oak Avenue, California`
- ✅ Profession: `Doctor`
- ✅ Issuing Country: `Usa`
- ✅ Issuing Authority: `Department Of State`
- ✅ Issue Date: `2022-05-10`
- ✅ Expiration Date: `2032-05-09`

---

## Test Case 4: Abbreviated English Format

### Input Text:
```
PASSPORT
Document No: GH7777777
Surname: WILLIAMS
Given Name: Robert
D.O.B.: 05/03/1988
P.O.B.: Chicago
Sex: M
Nat.: American
Addr.: 789 Pine Street, Illinois
Prof.: Teacher
Country Code: USA
Auth.: U.S. Passport Agency
D.O.I.: 20/07/2023
D.O.E.: 19/07/2033
```

### Expected Extraction:
- ✅ Passport Number: `GH7777777`
- ✅ Last Name: `WILLIAMS`
- ✅ First Name: `Robert`
- ✅ Date of Birth: `1988-03-05`
- ✅ Place of Birth: `Chicago`
- ✅ Gender: `M`
- ✅ Nationality: `American`
- ✅ Address: `789 Pine Street, Illinois`
- ✅ Profession: `Teacher`
- ✅ Issuing Country: `États-Unis`
- ✅ Issuing Authority: `U.s. Passport Agency`
- ✅ Issue Date: `2023-07-20`
- ✅ Expiration Date: `2033-07-19`

---

## Test Case 5: Mixed Format with MRZ

### Input Text:
```
PASSPORT / PASSEPORT

P<CODKABILA<<JOSEPH<DESIRE<<<<<<<<<<<<<<<<
CD98765439COD8006121M3103140<<<<<<<<<<<<<<08

Passport No: CD9876543
Family Name: KABILA
Second Name: DESIRE
Forename: Joseph
Birth Date: 12 JUN 1980
Birth Place: Lubumbashi
Sex: M
Citizenship: Congolese
Residence: Kinshasa, DRC
Title: Civil Engineer
Issuing State: Democratic Republic of Congo
Authority: DGM
Issued: 15/03/2021
Expires: 14/03/2031
```

### Expected Extraction:
- ✅ Passport Number: `CD9876543`
- ✅ Last Name: `KABILA`
- ✅ Middle Name: `DESIRE`
- ✅ First Name: `Joseph`
- ✅ Date of Birth: `1980-06-12`
- ✅ Place of Birth: `Lubumbashi`
- ✅ Gender: `M`
- ✅ Nationality: `Congolese`
- ✅ Address: `Kinshasa, Drc`
- ✅ Profession: `Civil Engineer`
- ✅ Issuing Country: `République Démocratique Du Congo` (from MRZ)
- ✅ Issuing Authority: `Dgm`
- ✅ Issue Date: `2021-03-15`
- ✅ Expiration Date: `2031-03-14`

---

## Test Case 6: Alternative Date Formats

### Input Text:
```
PASSPORT

Document Number: IJ9999999
Surname: BROWN
Given Names: Emma Louise
Born: 25JAN1995
Place of Birth: London
Gender: F
Nationality: British
Address: 101 Baker Street, London
Job: Architect
Valid Until: 24 JAN 2035
```

### Expected Extraction:
- ✅ Passport Number: `IJ9999999`
- ✅ Last Name: `BROWN`
- ✅ First Name: `Emma Louise`
- ✅ Date of Birth: `1995-01-25`
- ✅ Place of Birth: `London`
- ✅ Gender: `F`
- ✅ Nationality: `British`
- ✅ Address: `101 Baker Street, London`
- ✅ Profession: `Architect`
- ✅ Expiration Date: `2035-01-24`

---

## Test Case 7: French Canadian Format

### Input Text:
```
PASSEPORT CANADIEN / CANADIAN PASSPORT

N° de passeport: KL1111111
Nom de famille: TREMBLAY
Prénoms: Marie-Claire
Née le: 18/09/1990
Lieu de naissance: Montréal
Sexe: F
Nationalité: Canadienne
Domicile: 555 Rue Saint-Jacques, Québec
Métier: Avocat
Pays émetteur: Canada
Autorité: Immigration, Réfugiés et Citoyenneté Canada
Date d'émission: 01/02/2022
Valable jusqu'à: 31/01/2032
```

### Expected Extraction:
- ✅ Passport Number: `KL1111111`
- ✅ Last Name: `TREMBLAY`
- ✅ First Name: `Marie-Claire`
- ✅ Date of Birth: `1990-09-18`
- ✅ Place of Birth: `Montréal`
- ✅ Gender: `F`
- ✅ Nationality: `Canadienne`
- ✅ Address: `555 Rue Saint-Jacques, Québec`
- ✅ Profession: `Avocat`
- ✅ Issuing Country: `Canada`
- ✅ Issuing Authority: `Immigration, Réfugiés Et Citoyenneté Canada`
- ✅ Issue Date: `2022-02-01`
- ✅ Expiration Date: `2032-01-31`

---

## Pattern Coverage Summary

### English Keywords Supported:
- Passport, Document
- Surname, Family Name, Last Name
- Given Names, First Name, Forename
- Middle Name, Second Name
- Date of Birth, Birth Date, D.O.B., Born
- Place of Birth, Birth Place, P.O.B., Born in/at
- Sex, Gender, Male, Female
- Nationality, Citizenship, Country
- Address, Residence, Street, Avenue
- Occupation, Job, Title, Profession
- Issuing Country, Country of Issue, Issuing State
- Authority, Issued by, Delivered by
- Date of Issue, Issue Date, Issued, D.O.I.
- Date of Expiry, Expiration Date, Expires, Valid Until, D.O.E.

### French Keywords Supported:
- Passeport, Document
- Nom, Nom de famille
- Prénoms, Prénom
- Postnom, Post-nom
- Date de naissance, Né(e) le
- Lieu de naissance, Lieu
- Sexe, Masculin, Féminin
- Nationalité, Pays
- Adresse, Domicile, Résidence, Rue, Avenue
- Profession, Emploi, Métier, Titre
- Pays émetteur, État émetteur
- Autorité, Émis par, Délivré par
- Date d'émission, Émis
- Date d'expiration, Expire, Valable jusqu'à

### Compound/Concatenated Forms:
- PassportNumber, DocumentNo
- LastName, FirstName, MiddleName
- DateBirth, BirthDate, BirthPlace
- IssuingCountry, IssuingAuthority
- IssueDate, ExpirationDate

---

## Testing Instructions

1. **Manual Testing**: Copy any test case input text and process it through the OCR service
2. **Image Testing**: Create passport images with the text from test cases and run through the complete OCR pipeline
3. **Validation**: Compare extracted data with expected results
4. **Edge Cases**: Test with poor quality images, partial text, mixed languages

## Success Criteria

- ✅ All fields correctly identified in English format
- ✅ All fields correctly identified in French format
- ✅ Mixed language documents handled correctly
- ✅ Abbreviated forms recognized
- ✅ Compound keywords (no spaces) recognized
- ✅ Date formats normalized to YYYY-MM-DD
- ✅ Names properly capitalized
- ✅ MRZ data extracted and parsed
- ✅ Country codes converted to full names
