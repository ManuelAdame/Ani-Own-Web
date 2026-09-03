from flask import Flask, render_template, jsonify, send_from_directory
import json
import random
import string
import os

app = Flask(__name__)

# Cargar preguntas
with open('questions.json', 'r', encoding='utf-8') as f:
    questions_data = json.load(f)

# Cargar preguntas para sopa de letras
with open('sopa_questions.json', 'r', encoding='utf-8') as f:
    sopa_questions_data = json.load(f)

# Cargar preguntas para boom
with open('boom_questions.json', 'r', encoding='utf-8') as f:
    boom_questions_data = json.load(f)

# Cargar preguntas para trivia 2004-2022
with open('trivia_2004_2022.json', 'r', encoding='utf-8') as f:
    trivia_2004_2022_data = json.load(f)

# Cargar preguntas para trivia 2023
with open('trivia_2023.json', 'r', encoding='utf-8') as f:
    trivia_2023_data = json.load(f)

# Cargar preguntas para trivia 2024
with open('trivia_2024.json', 'r', encoding='utf-8') as f:
    trivia_2024_data = json.load(f)

# Cargar preguntas para trivia 2025
with open('trivia_2025.json', 'r', encoding='utf-8') as f:
    trivia_2025_data = json.load(f)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/static/music/<path:filename>')
def serve_music(filename):
    return send_from_directory('static/music', filename)

@app.route('/api/playlist')
def get_playlist():
    music_dir = os.path.join(os.path.dirname(__file__), 'static', 'music')
    songs = [f for f in os.listdir(music_dir) if f.endswith('.mp3')]
    songs.sort()  # Ordenar por nombre
    return jsonify({'songs': songs})

@app.route('/pasapalabra')
def pasapalabra():
    return render_template('pasapalabra.html')

@app.route('/sopa-de-letras')
def sopa_de_letras():
    return render_template('sopa_de_letras.html')

@app.route('/boom')
def boom():
    return render_template('boom.html')

@app.route('/trivia-2004-2022')
def trivia_2004_2022():
    return render_template('trivia_2004_2022.html')

@app.route('/trivia-2023')
def trivia_2023():
    return render_template('trivia_2023.html')

@app.route('/trivia-2024')
def trivia_2024():
    return render_template('trivia_2024.html')

@app.route('/trivia-2025')
def trivia_2025():
    return render_template('trivia_2025.html')

@app.route('/api/pasapalabra')
def get_pasapalabra():
    # Agrupar preguntas por letra
    preguntas_por_letra = {}
    for pregunta in questions_data['questions']:
        letra = pregunta['letter']
        if letra not in preguntas_por_letra:
            preguntas_por_letra[letra] = []
        preguntas_por_letra[letra].append(pregunta)
    
    # Seleccionar una pregunta aleatoria por letra
    resultado = []
    for letra in sorted(preguntas_por_letra.keys()):
        pregunta_seleccionada = random.choice(preguntas_por_letra[letra])
        resultado.append(pregunta_seleccionada)
    
    return jsonify(resultado)

@app.route('/api/sopa-de-letras')
def get_sopa_de_letras():
    # Seleccionar una pregunta aleatoria de sopa_questions.json
    pregunta = random.choice(sopa_questions_data['questions'])
    respuesta = pregunta['answer'].upper().replace(' ', '')
    
    # Generar sopa de letras
    sopa_size = 12
    sopa = [list(random.choices(string.ascii_uppercase, k=sopa_size)) for _ in range(sopa_size)]
    
    # Direcciones posibles: (dx, dy)
    direcciones = [
        (1, 0),   # Horizontal derecha
        (-1, 0),  # Horizontal izquierda
        (0, 1),   # Vertical abajo
        (0, -1),  # Vertical arriba
        (1, 1),   # Diagonal abajo-derecha
        (1, -1),  # Diagonal arriba-derecha
        (-1, 1),  # Diagonal abajo-izquierda
        (-1, -1)  # Diagonal arriba-izquierda
    ]
    
    # Seleccionar dirección aleatoria
    dx, dy = random.choice(direcciones)
    
    # Encontrar posición válida para insertar la palabra
    posicion_valida = False
    intentos = 0
    
    while not posicion_valida and intentos < 100:
        fila = random.randint(0, sopa_size - 1)
        col = random.randint(0, sopa_size - 1)
        
        # Verificar si cabe la palabra en esta dirección
        nueva_fila = fila + dy * (len(respuesta) - 1)
        nueva_col = col + dx * (len(respuesta) - 1)
        
        if 0 <= nueva_fila < sopa_size and 0 <= nueva_col < sopa_size:
            posicion_valida = True
        
        intentos += 1
    
    # Insertar la respuesta en la sopa
    if posicion_valida:
        for i, letra in enumerate(respuesta):
            sopa[fila + dy * i][col + dx * i] = letra
    
    return jsonify({
        'pregunta': pregunta['question'],
        'respuesta': pregunta['answer'],
        'sopa': sopa,
        'respuesta_sin_espacios': respuesta
    })

@app.route('/api/boom')
def get_boom():
    # Seleccionar una pregunta aleatoria
    pregunta = random.choice(boom_questions_data['questions'])
    
    # Mezclar todas las opciones
    todas_opciones = pregunta['correct_options'] + [pregunta['incorrect_option']]
    random.shuffle(todas_opciones)
    
    return jsonify({
        'question': pregunta['question'],
        'options': todas_opciones,
        'incorrect_option': pregunta['incorrect_option']
    })

@app.route('/api/trivia-2004-2022')
def get_trivia_2004_2022():
    # Retornar todas las preguntas en orden
    return jsonify(trivia_2004_2022_data)

@app.route('/api/trivia-2023')
def get_trivia_2023():
    # Retornar todas las preguntas en orden
    return jsonify(trivia_2023_data)

@app.route('/api/trivia-2024')
def get_trivia_2024():
    # Retornar todas las preguntas en orden
    return jsonify(trivia_2024_data)

@app.route('/api/trivia-2025')
def get_trivia_2025():
    # Retornar todas las preguntas en orden
    return jsonify(trivia_2025_data)

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)

