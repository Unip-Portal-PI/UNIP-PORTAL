from datetime import datetime, timezone, timedelta

# Fuso horário de Brasília (UTC-3)
BR_TZ = timezone(timedelta(hours=-3))

def get_now_br():
    """Retorna o datetime atual no fuso horário de Brasília."""
    return datetime.now(BR_TZ)
