
from module1.submodule1 import process_data
from module2.utils import load_config

def main():
    config = load_config()
    result = process_data(config)
    print(result)

if __name__ == "__main__":
    main()
