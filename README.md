# MosaicPress

MosaicPress is an independent CMS that starts from the [WordPress development tree](https://github.com/WordPress/wordpress-develop). WordPress stays the reference upstream. MosaicPress has its own version, `1.0.0` in `$mosaicpress_version`, and its own release branches.

Active work for this release is on `feature/1.0.0`. It merges into `dev`, and releases land on `main`.

* [Getting Started](#getting-started)
* [Credentials](#credentials)

## Getting Started

### Local development

MosaicPress is a PHP, MySQL, and JavaScript project, and uses Node for its JavaScript dependencies. A local development environment is available to quickly get up and running.

You will need a basic understanding of how to use the command line on your computer. This will allow you to set up the local development environment, to start it and stop it when necessary, and to run the tests.

You will need Node and npm installed on your computer. Node is a JavaScript runtime used for developer tooling, and npm is the package manager included with Node. If you have a package manager installed for your operating system, setup can be as straightforward as:

* macOS: `brew install node`
* Windows: `choco install nodejs`
* Ubuntu: `apt install nodejs npm`

If you are not using a package manager, see the [Node.js download page](https://nodejs.org/en/download/) for installers and binaries.

**Note:** This checkout and the Playground preview require Node.js `>=24.16.0` and npm `>=11.13.0` (see `.nvmrc`).

For the full local development environment commands below, you will also need a container environment such as [Docker Desktop](https://www.docker.com/products/docker-desktop) installed and running on your computer. The Playground preview does not require it.

**Note:** The inherited environment officially supports Docker. Other container environments are generally compatible, such as [Colima](https://github.com/abiosoft/colima), [OrbStack](https://orbstack.dev/), [Podman Desktop](https://podman-desktop.io/), and [Rancher Desktop](https://rancherdesktop.io/).

### Browser preview with Playground

For a disposable browser preview of the current checkout, first build it:

```
npm run build
npm run playground
```

Each `npm run build` recreates the `build/` directory from scratch, so Playground runtime files from a previous session do not carry over. The preview mounts that build, does not download WordPress, and logs you in as an administrator. SQLite data and uploads persist only for the current Playground session; use **Daten zurücksetzen & neu starten** in **Tools → Mosaic Playground** to wipe them without stopping. Under **Tools → Mosaic Playground**, the preview also provides server status, restart, and stop controls. They are injected only into the local Playground build; manual and production builds do not contain them. Rebuild after source changes. The first run downloads the Playground runtime (not WordPress) and prints its local URL; stop it with `Ctrl+C`.

In PowerShell, use `powershell -ExecutionPolicy Bypass -File .\playground.ps1`; on macOS/Linux, use `sh ./playground.sh`. Additional Playground options are passed through, for example `powershell -ExecutionPolicy Bypass -File .\playground.ps1 --port=9500`.

### Development Environment Commands

Ensure your container environment is running before using these commands.

#### To start the development environment for the first time

Clone the repository and check out the active release branch:

```
git clone https://github.com/glennski/MosaicPress.git
cd MosaicPress
git checkout feature/1.0.0
```

`origin` is [glennski/MosaicPress](https://github.com/glennski/MosaicPress). WordPress stays on `upstream`:

```
git remote add upstream https://github.com/WordPress/wordpress-develop.git
```

Upstream changes are reviewed and ported on purpose. They are not merged in wholesale.

Then install dependencies and start the environment:

```
npm install
npm run build:dev
npm run env:start
npm run env:install
```

The site will be accessible at http://localhost:8889. You can see or change configurations in the `.env` file located at the root of the project directory.

#### To watch for changes

If you're making changes to WordPress core files, you should start the file watcher in order to build or copy the files as necessary:

```
npm run dev
```

To stop the watcher, press `ctrl+c`.

#### To run a [WP-CLI](https://make.wordpress.org/cli/handbook/) command

```
npm run env:cli -- <command>
```

WP-CLI has [many useful commands](https://developer.wordpress.org/cli/commands/) you can use to work on your WordPress site. Where the documentation mentions running `wp`, run `npm run env:cli --` instead. For example:

```
npm run env:cli -- help
```

#### To run the tests

These commands run the PHP and end-to-end test suites, respectively:

```
npm run test:php
npm run test:e2e
```

You can pass extra parameters into the PHP tests by adding `--` and then the [command-line options](https://docs.phpunit.de/en/10.4/textui.html#command-line-options):

```
npm run test:php -- --filter <test name>
npm run test:php -- --group <group name or ticket number>
```

To run the JavaScript (QUnit) tests:

```
npm run grunt qunit:compiled
```

`qunit:compiled` builds first, then runs the suite. The QUnit runner loads
scripts from the built `build/` directory, so a plain `npm run grunt qunit`
requires a completed `npm run build` first without a build, every test fails
with a `jQuery is not defined` error.

#### To lint the workflow files

GitHub Actions workflows operate in a privileged software supply chain environment, therefore all workflow files must adhere to a high degree of quality and security standards.

All YAML workflow files within the `.github/workflows` directory are statically scanned when modified using [Actionlint](https://github.com/rhysd/actionlint) and [Zizmor](https://github.com/zizmorcore/zizmor). It's recommended that you install both of these tools locally using a package manager to run prior to submitting changes to workflow files.

- [Actionlint installations instructions](https://github.com/rhysd/actionlint/blob/main/docs/install.md)
- [Zizmor installation instructions](https://docs.zizmor.sh/installation/)

To run Actionlint:

```
actionlint
```

To run Zizmor for all workflow files (note the trailing period):

```
zizmor .
```

**Note:** A workflow run failure will not occur when issues are detected by Zizmor. Instead, the generated report is submitted to GitHub Code Scanning and surfaced through a status check. Some locally reported issues may be ignored based on the repository's configured Code Scanning settings.

#### Generating a code coverage report
PHP code coverage reports are [generated daily](https://github.com/WordPress/wordpress-develop/actions/workflows/test-coverage.yml) and [submitted to Codecov.io](https://app.codecov.io/gh/WordPress/wordpress-develop).

After the local container environment has [been installed and started](#to-start-the-development-environment-for-the-first-time), the following command can be used to generate a code coverage report. 

```
npm run test:coverage
```

The command will generate three coverage reports in HTML, PHP, and text formats, saving them in the `coverage` folder.

**Note:** xDebug is required to generate a code coverage report, which can slow down PHPUnit significantly. Passing selection-based options such as `--group` or `--filter` can decrease the overall time required but will result in an incomplete report.

#### To restart the development environment

You may want to restart the environment if you've made changes to the configuration in the `docker-compose.yml` or `.env` files. Restart the environment with:

```
npm run env:restart
```

#### To stop the development environment

You can stop the environment when you're not using it to preserve your computer's power and resources:

```
npm run env:stop
```

#### To start the development environment again

Starting the environment again is a single command:

```
npm run env:start
```

#### Resetting the development environment

The development environment can be reset. This will destroy the database and attempt to remove the pulled container images.

```
npm run env:reset
```

### Apple Silicon machines and old MySQL/MariaDB versions

Older MySQL and MariaDB container images do not support Apple Silicon processors (M1, M2, etc.). This is true for:

- MySQL versions 5.7 and earlier
- MariaDB 5.5

When using these versions on an Apple Silicon machine, you must create a `docker-compose.override.yml` file with the following contents:

```
services:

  mysql:
    platform: linux/amd64
```

Additionally, the "Use Rosetta for x86/AMD64 emulation on Apple Silicon" setting in your container environment (if applicable) needs to be disabled for this workaround.

## Credentials

These are the default environment credentials:

* Database Name: `wordpress_develop`
* Username: `root`
* Password: `password`

To login to the site, navigate to http://localhost:8889/wp-admin.

* Username: `admin`
* Password: `password`

**Note:** With Codespaces, open the portforwarded URL from the ports tab in the terminal, and append `/wp-admin` to login to the site.

To generate a new password (recommended):

1. Go to the Dashboard
2. Click the Users menu on the left
3. Click the Edit link below the admin user
4. Scroll down and click 'Generate password'. Either use this password (recommended) or change it, then click 'Update User'. If you use the generated password be sure to save it somewhere (password manager, etc).
