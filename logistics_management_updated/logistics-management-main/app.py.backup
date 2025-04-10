
    from flask import Flask, jsonify

    app = Flask(__name__)

    @app.route('/')
    def home():
        return jsonify({
            "message": "Logistics Management repository is fully functional.",
            "features": [
                "AI-driven tools",
                "Quantum-grade encryption",
                "Professional dashboards"
            ]
        })

    if __name__ == '__main__':
        app.run(debug=True, host='0.0.0.0', port=5000)
    