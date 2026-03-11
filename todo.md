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

## Recently Completed Features
- [x] Add visual distinction for averages (subtle background color or "Gennemsnit" label)
- [x] Implement performance alerts for routes below 90% delivery success
- [x] Include avg breaks in minutes on Performance page for each route
- [x] Reposition "Gennemsnit Avg twAdhDL" under leveringer bar instead of beside it
- [x] Add export/share performance reports functionality
- [x] Make Gennemsnit boxes smaller (reduced padding and font size)
- [x] Make "Under 90%" warning label smaller (reduced icon and padding)
- [x] Show average pause for all routes (including when 0.0 min)
- [x] Add "Avg:" label for pause (matching Total Stops format)
- [x] Make Avg twAdhDL even smaller and less prominent (minimal styling)
- [x] Further reduce "Under 90%" badge size for less focus
- [x] Implement responsive grid layout (1 col mobile, 2 col tablet, 3 col desktop)
- [x] Add "Sidst opdateret" timestamp to Tag fra listen page header
- [x] Fix timestamp to only update when data actually changes (not on every reload)
- [x] Fix: Only show data from the newest date - filter both ODIN and Stop to same latest date

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
