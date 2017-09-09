select *
from valuations
inner join teams
on teams.teamid = valuations.valuationteamid
where year = 2017
