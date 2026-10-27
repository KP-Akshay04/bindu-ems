from app import create_app

app = create_app()

@app.route("/")
def home():
    return {
        "project": "BINDU EMS",
        "status": "running"
    }

if __name__ == "__main__":
    app.run(host="0.0.0.0", debug=True)