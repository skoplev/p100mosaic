#!/usr/bin/env python

from flask import Flask, render_template

app = Flask(__name__, static_url_path='/p100mosaic/static', static_folder='static')

@app.route("/p100mosaic")
def index():
	return render_template("index.html")

if __name__ == "__main__":
	app.run(host="0.0.0.0", port=5000)
	# app.run(host="0.0.0.0", port=8080)
