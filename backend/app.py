from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route('/api/feedback', methods=['POST'])
def feedback():
    choreography = request.files.get('choreography')
    dance = request.files.get('dance')

    if not choreography or not dance:
        return jsonify({'error': 'Both videos are required.'}), 400

    # Change here once we generate actual feedback
    return jsonify({'feedback': 'Your dance is 90% similar to the choreography!'})

if __name__ == '__main__':
    app.run(debug=True)
