# MLS ELO

Calculates [ELO rankings](https://en.wikipedia.org/wiki/Elo_rating_system) for [MLS teams](https://www.mlssoccer.com/) using the [FIFA Women's World Rankings](https://en.wikipedia.org/wiki/FIFA_Women%27s_World_Rankings) procedure.

## Current Standings

```sh
» mls-elo standings
ELO Standings as of 2017-8-13

1.) Toronto FC (1402)
2.) Seattle Sounders (1369)
3.) New York City FC (1367)
4.) Atlanta United (1351)
5.) Red Bull New York (1343)
6.) Chicago Fire (1342)
7.) Sporting Kansas City (1325)
8.) Houston Dynamo (1315)
9.) FC Dallas (1313)
10.) Montreal Impact (1313)
11.) Vancouver Whitecaps (1304)
12.) Portland Timbers (1290)
13.) Columbus Crew (1281)
14.) New England Revolution (1269)
15.) Real Salt Lake (1260)
16.) Orlando United (1247)
17.) San Jose Earthquakes (1246)
18.) Philadelphia Union (1241)
19.) Colorado Rapids (1241)
20.) LA Galaxy (1212)
21.) Minnesota United (1188)
22.) DC United (1169)
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
