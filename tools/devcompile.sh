#!/bin/bash
env ___BUILD___="dev_`date +'%F %T'`" ./node_modules/.bin/webpack --config config.js
