select max(elo) as maxelo, teamname,
  date from rankings
inner join teams
  on rankings.rankingteamid = teams.teamid
group by teamname
order by maxelo
desc limit 1
