select (draws*1.0) / (matches*1.0) as drawpercentage from
  (select (select count(*) from matches where homegoals = awaygoals) as draws,
  (select count(*) from matches) as matches)
