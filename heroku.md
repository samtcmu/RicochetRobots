# Helpful heroku commands.

View server logs

```
heroku logs --tail
```

Push a new release to heroku

```
git push heroku master
```

Check to see if the web process is running

```
heroku ps
```

Make sure there is at least a single heroku server for the web process

```
heroku ps:scale web=1
```

If running a web server make sure to use the `$PORT` environment variable
instead of specifying your own custom port.
