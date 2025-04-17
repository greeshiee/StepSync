# Backend Setup & Commands

## Create and Activate Virtual Environment

### Create the virtual environment (only once):
```
python -m venv venv
```


### Activate the virtual environment:
- Windows (PowerShell):
```
.\venv\Scripts\Activate.ps1
```

- Windows (Command Prompt):
```
.\venv\Scripts\activate.bat
```

- macOS/Linux:
```
source venv/bin/activate
```

## Install Dependencies
```
pip install flask flask-cors
```

## Run the Backend Server
```
python app.py
```

## Deactivate the Virtual Environment
```
deactivate
```
