# MLS ELO

Calculates [ELO rankings](https://en.wikipedia.org/wiki/Elo_rating_system) for [MLS teams](https://www.mlssoccer.com/) using the [FIFA Women's World Rankings](https://en.wikipedia.org/wiki/FIFA_Women%27s_World_Rankings) procedure.

## Current Standings

```sh
» mls-elo standings
Standings as of 2017-7-22

1.) FC Dallas (1379)
2.) Toronto FC (1379)
3.) New York City FC (1369)
4.) Chicago Fire (1362)
5.) Atlanta United (1359)
6.) Red Bull New York (1346)
7.) Sporting Kansas City (1331)
8.) Seattle Sounders (1311)
9.) Vancouver Whitecaps (1308)
10.) Houston Dynamo (1307)
11.) Columbus Crew (1282)
12.) Montreal Impact (1269)
13.) Philadelphia Union (1254)
14.) Real Salt Lake (1254)
15.) New England Revolution (1253)
16.) Portland Timbers (1253)
17.) Orlando United (1252)
18.) Colorado Rapids (1248)
19.) San Jose Earthquakes (1248)
20.) LA Galaxy (1240)
21.) DC United (1206)
22.) Minnesota United (1194)
```

## Getting started

To install mls-elo, use [npm](https://npmjs.com)

```sh
$ npm i -g mls-elo
```

Once the cli is available, bootstrap the database

```sh
$ mls-elo create
$ mls-elo data
$ mls-elo import
$ mls-elo rank
```

Now that the cli is available, and the database is bootstrapped, you can use the cli to investigate the current MLS standings

```sh
$ mls-elo standings
# Outputs the current MLS teams and their ELO rankings
$ mls-elo predict SJ at SEA
# Predicts the outcome of a given match
```

## Keeping the database up-to-date

To update the database with the latest data, run

```sh
$ mls-elo data
$ mls-elo import
$ mls-elo rank
```

This will fetch the latest data, import it into the database, and recalculate the rankings data.
