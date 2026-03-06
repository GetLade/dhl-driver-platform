# DHL Driver Platform TODO

## Completed Features
- [x] Dashboard (Flyoverblik) - Flight overview with ETA, CNY, Flyers, Total, ULDs, Early ULDs, DD-TD
- [x] Performance page - Route performance combining ODIN delivery/pickup data with Stop statistics
- [x] GT-Liste (Tag fra liste) - Package table with search, sorting, and totals
- [x] Google Sheets API integration for all three pages
- [x] Smart polling (every 5 minutes, only 05:00-09:00 CET)
- [x] Danish date format (DD.MM.YYYY)
- [x] DHL brand colors (Red #D40511, Yellow #FFCC00)
- [x] Mobile-first responsive design
- [x] Footer attribution "Platform af Filip Lade til Pakkenbilen"
- [x] Data change detection via hash comparison
- [x] Fixed nested button errors
- [x] Fixed React infinite loop issues
- [x] Fixed parseGTListe to read all rows from Google Sheets
- [x] Created Performance page combining ODIN + Stop data
- [x] Fixed Statestik sheet name (was "Statistik", now "Statestik")
- [x] Fixed column indices in parseStatistik (Avg twAdhDL now uses column J instead of I)

## Known Behavior
- Average statistics (Avg Total Stops, Avg SPORH, Avg Break minutes) show current day values initially
- Will show true averages next week when more historical data is available
- Statistics only display for routes that have ODIN or Stop data
- Missing data is handled gracefully (shows "Ingen ODIN-data tilgængelig" when applicable)

## Sheet Names (Confirmed)
- DagensTal - Flight overview data
- Odin - Route performance data
- Stop - Stop statistics data
- GTListe - Package list data
- Statestik - Average statistics (note: "Statestik" not "Statistik")
