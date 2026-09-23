#!/bin/sh
set -eu

data_dir=/var/lib/mysql
run_dir=/run/mysqld
socket="$run_dir/mysqld.sock"

mkdir -p "$data_dir" "$run_dir"
chown -R mysql:mysql "$data_dir" "$run_dir"

if [ ! -d "$data_dir/mysql" ]; then
	printf '%s\n' 'Initialising MariaDB...'
	mariadb-install-db --user=mysql --datadir="$data_dir" --skip-test-db
fi

mariadbd --user=mysql --datadir="$data_dir" --socket="$socket" --bind-address=127.0.0.1 &
mariadb_pid=$!

stop() {
	if [ -n "${apache_pid:-}" ]; then
		kill -TERM "$apache_pid" 2>/dev/null || true
	fi
	mariadb-admin --socket="$socket" -uroot shutdown 2>/dev/null || kill -TERM "$mariadb_pid" 2>/dev/null || true
	wait "${apache_pid:-}" 2>/dev/null || true
	wait "$mariadb_pid" 2>/dev/null || true
}

trap stop 0
trap 'exit 0' INT TERM

attempts=0
until mariadb-admin --socket="$socket" -uroot ping --silent; do
	if ! kill -0 "$mariadb_pid" 2>/dev/null; then
		wait "$mariadb_pid"
		exit 1
	fi
	attempts=$((attempts + 1))
	if [ "$attempts" -ge 60 ]; then
		printf '%s\n' 'MariaDB did not become ready within 60 seconds.' >&2
		exit 1
	fi
	sleep 1
done

mariadb --socket="$socket" -uroot <<'SQL'
CREATE DATABASE IF NOT EXISTS wordpress;
CREATE USER IF NOT EXISTS 'wordpress'@'localhost' IDENTIFIED BY 'wordpress';
CREATE USER IF NOT EXISTS 'wordpress'@'127.0.0.1' IDENTIFIED BY 'wordpress';
GRANT ALL PRIVILEGES ON wordpress.* TO 'wordpress'@'localhost';
GRANT ALL PRIVILEGES ON wordpress.* TO 'wordpress'@'127.0.0.1';
FLUSH PRIVILEGES;
SQL

wordpress_path=/var/www/html
site_url="${WORDPRESS_URL:-http://localhost:8080}"
admin_user="${WORDPRESS_ADMIN_USER:-admin}"
admin_password="${WORDPRESS_ADMIN_PASSWORD:-password}"
admin_email="${WORDPRESS_ADMIN_EMAIL:-admin@example.test}"
site_title="${WORDPRESS_TITLE:-MosaicPress}"

if wp core is-installed --path="$wordpress_path" --allow-root; then
	wp core update-db --path="$wordpress_path" --allow-root
else
	printf '%s\n' 'Installing WordPress...'
	wp core install --path="$wordpress_path" --url="$site_url" --title="$site_title" --admin_user="$admin_user" --admin_password="$admin_password" --admin_email="$admin_email" --skip-email --allow-root
	wp rewrite structure '/%year%/%monthnum%/%postname%/' --path="$wordpress_path" --allow-root
fi

apache2-foreground &
apache_pid=$!
if wait "$apache_pid"; then
	apache_status=0
else
	apache_status=$?
fi
exit "$apache_status"
