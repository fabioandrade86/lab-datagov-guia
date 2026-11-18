# Guia do Lab: Databricks + Fabric + Purview

Guia prático (site estático) para montar um lab, explorar e levar a cliente uma arquitetura de **dados não estruturados** (PDF, imagens, Word, PowerPoint):

- **Azure Databricks**: ingestão em Volumes do Unity Catalog, extração com `ai_parse_document` e `ai_extract`, medalhão bronze/silver/gold.
- **Microsoft Fabric**: consumo sem cópia via *Mirrored Azure Databricks catalog*, SQL endpoint e Power BI.
- **Microsoft Purview**: rótulos de sensibilidade, DLP para Fabric, Audit.

## Conteúdo

- Arquitetura alvo e matriz "onde cada controle atua"
- Trilha M0 a M10 com passos (onde clicar, o que esperar), código comentado e perguntas de checagem
- Exploração guiada e experimentos "e se?"
- Recursos e status (GA, preview, beta, aposentadoria)
- Necessidades: licenças, papéis, rede, identidade, dados
- Casos de uso, seletor de cenários, riscos e roteiro para o cliente

## Uso

Abra o site publicado no GitHub Pages. Em **Meu ambiente**, preencha os nomes do seu lab: eles ficam salvos apenas no navegador (localStorage) e são aplicados em todos os blocos de código. O progresso dos módulos também fica no navegador.

Para rodar localmente, basta abrir `index.html` ou servir a pasta:

```bash
python3 -m http.server 8000
```

## Avisos

- Guia de estudo independente; não é documentação oficial da Microsoft ou da Databricks.
- Status e licenças verificados em 18/11/2026. Reconfira na fonte antes de decisões contratuais.
- Não use dados reais de cliente no lab sem alinhamento com o DPO (LGPD).
