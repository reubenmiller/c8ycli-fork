# Developer command line tools
To support you with bootstrapping, running and deploying applications we have built a Command Line Interface. The tool is the successor of the `cumulocity-node-tools`. To avoid conflicts, it listens to the new command `c8ycli` instead of `c8y`. You can install it via npm:

```
git clone https://github.com/reubenmiller/c8ycli-fork.git
cd c8ycli-fork
npm install --ignore-scripts
node ./cli.js new myapp
```

## Usage

```
c8ycli [options] [command]
```

## Options

```
    -u, --url <url>                 The URL of the remote instance
    --version                       Provides version number
    -h, --help                      Provides usage information
```

## Commands

All the commands except of ```new``` take an array of [glob patterns](https://en.wikipedia.org/wiki/Glob_(programming)). These will be solved to folders or entry point manifests.

```
    new [name] [template]                   Creates a folder to start a new application or extend an existing one
    serve [options] [appPaths...]           Runs local development server
    build [options] [appPaths...]           Builds the specified apps
    deploy [options] [appPaths...]          Deploys apps from the specified paths
    locale-extract [options] [srcPaths...]  Extracts all strings for translation and outputs the .po files to defined folder
```

## The `new` command
The `c8ycli new [name] [template]` helps to start an empty application or to extend one of our existing applications (Cockpit, Devicemanagement or Administration). To extend an existing application use as `[name]` and `[template]` the name of the existing application like this:
```
$ c8ycli new cockpit cockpit
```

## Application options

Application options can be defined with ```--app.<option>=<value>```. These will be applied to all applications found with ```[appPaths...]```.

```
    --app.name="My Application"
    --app.key=myapp-key
    --app.contextPath=myapplication
    --app.brandingEntry="./branding/mybranding.less"
```

## Webpack options

Webpack options can be defined with ```--env.<option>=<value>```. These will be directly passed to the webpack configuration.

```
    --env.mode="production"
    --env.hmr
```

## Using behind a corporate proxy

If you are using c8ycli behind a corporate proxy, then the proxy can be configured by setting the HTTPS_PROXY environment variable

```sh
export HTTPS_PROXY=http://10.0.0.1:8000
```

Urls which should not go through the proxy can be configured by setting the NO_PROXY environment variable.

```sh
export NO_PROXY=localhost,127.0.0.1
```
