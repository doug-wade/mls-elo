# MLS ELO

Calculates [ELO rankings](https://en.wikipedia.org/wiki/Elo_rating_system) for [MLS teams](https://www.mlssoccer.com/) using the [FIFA Women's World Rankings](https://en.wikipedia.org/wiki/FIFA_Women%27s_World_Rankings) procedure.

## Current Standings

```sh
» mls-elo standings
ELO Standings as of 2017-8-27

1.) Toronto FC (1447)
2.) New York City FC (1373)
3.) Seattle Sounders (1363)
4.) Vancouver Whitecaps (1340)
5.) Atlanta United (1333)
6.) Sporting Kansas City (1331)
7.) Portland Timbers (1321)
8.) Montreal Impact (1318)
9.) Red Bull New York (1316)
10.) Houston Dynamo (1313)
11.) Columbus Crew (1302)
12.) FC Dallas (1287)
13.) Chicago Fire (1278)
14.) Real Salt Lake (1276)
15.) New England Revolution (1252)
16.) San Jose Earthquakes (1251)
17.) Philadelphia Union (1242)
18.) DC United (1227)
19.) Orlando United (1225)
20.) Minnesota United (1215)
21.) Colorado Rapids (1201)
22.) LA Galaxy (1178)
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
