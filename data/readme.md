# Bright Spots Survey Data

## Remote Data Source

The remote data set is in the bucket https://cloud.oracle.com/object-storage/buckets/idtwlqf2hanz/laptop-extension-drive/objects?region=us-ashburn-1

A file called brightspots.csv is available in the bucket.

The URL for accessing the web application (using a PAR to refer to the file):

https://lucasjellema.github.io/brightspots/?datafilePAR=https://idtwlqf2hanz.objectstorage.us-ashburn-1.oci.customer-oci.com/p/Qw2oXM9mtGeGlnosZPUhxPD0Yvi74A0fMNC_UU_ppiMK-VH_NwUBg1HE2pQp1Une/n/idtwlqf2hanz/b/laptop-extension-drive/o/conclusion-assets/brightspots.csv

https://idtwlqf2hanz.objectstorage.us-ashburn-1.oci.customer-oci.com/p/tnYce_RmNWHwn60Bkd23Vdc1YEPYf4Fa6tdwZxsrNus1sd20WcJkoh3xpTVqxubl/n/idtwlqf2hanz/b/laptop-extension-drive/o/conclusion-assets/brightspots.csv

## CSV File Structure

The `brightspots.csv` file contains survey responses from various participants about customer challenges, emerging technologies, and products/suppliers. The file uses semicolon (`;`) as the delimiter.

### Header Fields

The CSV file contains the following header fields:

1. `Id` - Unique identifier for each survey response
2. `Start time` - When the survey was started
3. `Completion time` - When the survey was completed
4. `Email` - Email address (anonymized)
5. `Name` - Name field
6. `Jouw naam` - Respondent's name
7. `Jouw bedrijf` - Respondent's company
8. `newCustomerThemes` - New customer themes mentioned
9. `emergingTechVendorProduct` - Emerging technologies, vendors, or products
10. Multiple challenge fields (prefixed with `Wat zijn uitdagingen en thema's waar je klanten over hoort?`)
11. Multiple technology fields (prefixed with `TechAndConcepts`)
12. Multiple product fields (prefixed with `Wat zijn concrete producten en leveranciers waar je klanten over hoort?`)
13. `Edge Computing` - Interest level in Edge Computing
14. `Data Governance` - Interest level in Data Governance
15. `nieuwe werkplek & kennisdeling / "beter samenwerken"` - Interest level in new workplace & knowledge sharing
16. `Opmerkingen, Wensen, Suggesties` - Comments, wishes, suggestions

### Interest Levels

Interest levels in the survey are recorded using the following values:
- `Sterke, concrete interesse` - Strong, concrete interest
- `Redelijke interesse` - Reasonable interest
- `Vage interesse` - Vague interest
- `Niets over gehoord` - Not heard about

## Data Files

- `brightspots.csv` - Original survey data
- `brightspots copy.csv` - Working copy with additional records

## Notes on Missing Fields

- The original records (IDs 1-40) may be missing values for the last four fields: `Edge Computing`, `Data Governance`, `nieuwe werkplek & kennisdeling`, and `Opmerkingen, Wensen, Suggesties`
- The newer records (IDs 41-49) include these fields
- When processing this data, applications should handle the potential absence of these fields gracefully