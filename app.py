import urllib.parse
import webbrowser

# Função para ler dados do usuário
def get_user_input(prompt):
    return input(prompt)

nome = get_user_input('Nome: ')
endereco = get_user_input('Endereço: ')
telefone = get_user_input('Telefone: ')
cidade = get_user_input('Cidade: ')
email = get_user_input('Email: ')
nota_fiscal = get_user_input('Nota Fiscal (Sim/Não): ')
garantia = get_user_input('Garantia (Sim/Não): ')
modelo = get_user_input('Qual é o Aparelho ? (Notebook/Celular/Tablet): ')
marca = get_user_input('Marca do Aparelho: ')
defeito = get_user_input('Defeito Relatado: ')
descricao = get_user_input('Descrição: ')
total = get_user_input('Total R$: ')
data_entrada = get_user_input('Data de Entrada (YYYY-MM-DD): ')
data_saida = get_user_input('Data de Saída (YYYY-MM-DD): ')
whatsapp = get_user_input('WhatsApp do Cliente: ')

status = []
for status_option in ["Arranhado", "Trincado", "Desligando", "Sem Bateria", "Sem Chip", "Sem Cartão"]:
    if get_user_input(f'{status_option}? (S/N): ').strip().upper() == 'S':
        status.append(status_option)

status_str = ', '.join(status)

message = (
    "Primeira Linha - Acessórios e Aparelhos.\n\n"
    "NOTA ELETRÔNICA:\n\n"
    f"Nome Do Cliente: {nome}\n"
    f"Endereço Do Cliente: {endereco}\n"
    f"Telefone Do Cliente: {telefone}\n"
    f"Cidade: {cidade}\n"
    f"Email Do Cliente: {email}\n"
    f"Nota Fiscal: {nota_fiscal}\n"
    f"Garantia: {garantia}\n"
    f"Qual é o Aparelho ?: {modelo}\n"
    f"Marca do Aparelho: {marca}\n"
    f"Defeito Relatado: {defeito}\n"
    f"Descrição: {descricao}\n"
    f"Total R$: {total}\n"
    f"Data de Entrada: {data_entrada}\n"
    f"Data de Saída: {data_saida}\n"
    f"Status do Aparelho: {status_str}\n\n"
    "Condições Gerais:\n\n"
    "1. A garantia dos nossos serviços é de 90 dias.\n"
    "2. A garantia dos produtos é válida SOMENTE contra defeito de fabricação.\n"
    "3. Não cobrimos defeitos causados por mau uso, má instalação, queda ou desgaste.\n"
    "4. Mercadorias deixadas no prazo estipulado serão desmontadas para pagar os custos.\n"
    "5. Todos os valores estão no preço estipulado e descritos na Ordem de Serviço acima."
)

whatsapp_url = f"https://wa.me/{whatsapp}?text={urllib.parse.quote(message, safe='')}"
webbrowser.open(whatsapp_url)
