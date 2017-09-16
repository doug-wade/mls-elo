# MLS ELO

Calculates [ELO rankings](https://en.wikipedia.org/wiki/Elo_rating_system) for [MLS teams](https://www.mlssoccer.com/) using the [FIFA Women's World Rankings](https://en.wikipedia.org/wiki/FIFA_Women%27s_World_Rankings) procedure.

## Current Standings

```sh
» mls-elo standings

ELO Standings as of 2017-9-10

1.) Toronto FC (1453)
2.) New York City FC (1355)
3.) Seattle Sounders (1349)
4.) Portland Timbers (1346)
5.) Vancouver Whitecaps (1345)
6.) Atlanta United (1344)
7.) Sporting Kansas City (1329)
8.) Red Bull New York (1326)
9.) Columbus Crew (1297)
10.) Chicago Fire (1297)
11.) Houston Dynamo (1285)
12.) Montreal Impact (1282)
13.) New England Revolution (1277)
14.) FC Dallas (1272)
15.) Real Salt Lake (1271)
16.) Philadelphia Union (1246)
17.) San Jose Earthquakes (1245)
18.) Orlando United (1234)
19.) Colorado Rapids (1214)
20.) Minnesota United (1210)
21.) LA Galaxy (1209)
22.) DC United (1204)
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

## Handling 12/31/1969

The two busted Chicago matches took place on 6/27/2010 (at NE) and 6/9/2010 (vs Colorado)
