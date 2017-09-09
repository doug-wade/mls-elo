select home.teamname as hometeamname,
  homerankings.elo as homeelo,
  awayrankings.elo as awayelo,
  away.teamname as awayteamname,
  matches.date,
  homegoals,
  awaygoals
from matches
inner join teams as away
  on away.teamid = matches.awayteam
inner join teams as home
  on home.teamid = matches.hometeam
inner join rankings as homerankings
  on homerankings.rankingteamid = home.teamid
  and homerankings.date = matches.date
inner join rankings as awayrankings
  on awayrankings.rankingteamid = away.teamid
  and awayrankings.date = matches.date
where homegoals = awaygoals
