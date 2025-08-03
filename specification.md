

**Sumário**	

**[Especificação Técnica \- Modelagem de Dados de Planos	5](#especificação-técnica---modelagem-de-dados-de-planos)**

[1\. Introdução	5](#1.-introdução)

[1.1 Overview	5](#1.1-overview)

[1.2 Entidades Conforme Diagrama Corrigido	5](#1.2-entidades-conforme-diagrama-corrigido)

[1.3 Características da Modelagem	5](#1.3-características-da-modelagem)

[2\. Informações de Negócio	6](#2.-informações-de-negócio)

[2.1 Contexto do Sistema Energias	6](#2.1-contexto-do-sistema-energias)

[2.2 Modelo de Monetização	6](#2.2-modelo-de-monetização)

[2.3 Regras de Negócio Implementadas	6](#2.3-regras-de-negócio-implementadas)

[RN001 – Plano ativo por empresa	6](#rn001-–-plano-ativo-por-empresa)

[RN002 – Valor base negociado	7](#rn002-–-valor-base-negociado)

[RN003 – Registro de alterações de plano	7](#rn003-–-registro-de-alterações-de-plano)

[RN004 – Duração do plano	8](#rn004-–-duração-do-plano)

[RN005 – Limites de usuários por escopo (admin/comum)	8](#rn005-–-limites-de-usuários-por-escopo-\(admin/comum\))

[RN006 – Preço padrão por usuário extra (plano de prateleira)	9](#rn006-–-preço-padrão-por-usuário-extra-\(plano-de-prateleira\))

[RN007 – Preço adicional negociado (valor total extra)	9](#rn007-–-preço-adicional-negociado-\(valor-total-extra\))

[RN008 – Personalização por escopo de usuário	9](#rn008-–-personalização-por-escopo-de-usuário)

[RN009 – Ordem de precedência de precificação	10](#rn009-–-ordem-de-precedência-de-precificação)

[RN010 – Registro do uso do plano por usuário	10](#rn010-–-registro-do-uso-do-plano-por-usuário)

[RN011 – Validação de limites ao adicionar ou alterar usuários	11](#rn011-–-validação-de-limites-ao-adicionar-ou-alterar-usuários)

[RN012 – Cancelamento de planos	11](#rn012-–-cancelamento-de-planos)

[RN013 – Associações de relatórios ao plano	12](#rn013-–-associações-de-relatórios-ao-plano)

[RN014 – Integridade e chaves únicas	12](#rn014-–-integridade-e-chaves-únicas)

[RN015 – Controle de escopo dentro do uso do plano	13](#rn015-–-controle-de-escopo-dentro-do-uso-do-plano)

[3\. Stack Técnica	13](#3.-stack-técnica)

[3.1 Linguagem de Programação	13](#3.1-linguagem-de-programação)

[3.2 Bibliotecas	13](#3.2-bibliotecas)

[3.3 Práticas de Programação	13](#3.3-práticas-de-programação)

[3.4 Padrões de Design	14](#3.4-padrões-de-design)

[3.5 Ferramentas Aprovadas (Baseado no ADR)	14](#3.5-ferramentas-aprovadas-\(baseado-no-adr\))

[4\. Arquitetura e Estrutura	14](#4.-arquitetura-e-estrutura)

[4.1 Estrutura de Pastas	14](#4.1-estrutura-de-pastas)

[4.2 Camadas (Tiers/Layers)	15](#4.2-camadas-\(tiers/layers\))

[4.2.1 Camada de Domínio	15](#4.2.1-camada-de-domínio)

[4.2.2 Camada de Aplicação	15](#4.2.2-camada-de-aplicação)

[4.2.3 Camada de Interface	15](#4.2.3-camada-de-interface)

[4.2.4 Camada de Infraestrutura	16](#4.2.4-camada-de-infraestrutura)

[4.2.5 Camada de Plataforma	16](#4.2.5-camada-de-plataforma)

[5\. Fluxo de Dados	16](#5.-fluxo-de-dados)

[5.1 Input	16](#5.1-input)

[5.2 Processamento	16](#5.2-processamento)

[5.3 Output	17](#5.3-output)

[5.4 Persistência	17](#5.4-persistência)

[5.4.1 Banco Relacional (PostgreSQL)	17](#5.4.1-banco-relacional-\(postgresql\))

[5.4.2 Cache (Redis)	17](#5.4.2-cache-\(redis\))

[6\. Requisitos Não-Funcionais	17](#6.-requisitos-não-funcionais)

[6.1 Observabilidade	17](#6.1-observabilidade)

[6.2 Segurança	17](#6.2-segurança)

[6.3 Performance	18](#6.3-performance)

[6.4 Escalabilidade	18](#6.4-escalabilidade)

[6.5 Disponibilidade	18](#6.5-disponibilidade)

[6.6 Outros RAs Atendidos	18](#6.6-outros-ras-atendidos)

[7\. Referências	19](#7.-referências)

[7.1 Código Base	19](#7.1-código-base)

[7.2 Padrões de Comentários	19](#7.2-padrões-de-comentários)

[7.3 Estilo de Programação	19](#7.3-estilo-de-programação)

[7.4 Documentação Adicional	19](#7.4-documentação-adicional)

[8\. Modelagem de Dados	20](#8.-modelagem-de-dados)

[8.1 Entidade plan	20](#8.1-entidade-plan)

[Campos:	20](#created_at:-data/hora-de-criação-do-registro)

[● plan\_id: Identificador único do plano (chave primária)	20](#created_at:-data/hora-de-criação-do-registro)

[● plan\_name: Nome do plano (ex: Silver Plan, Gold Plan)	20](#created_at:-data/hora-de-criação-do-registro)

[● description: Descrição detalhada do plano e suas funcionalidades	20](#created_at:-data/hora-de-criação-do-registro)

[● default\_amount: Valor padrão do plano (pode ser sobrescrito por company\_plan.amount)	20](#created_at:-data/hora-de-criação-do-registro)

[● plan\_duration: Duração do plano como ENUM (mensal, anual, trimestral, vitalicio)	20](#created_at:-data/hora-de-criação-do-registro)

[● plan\_type\_id: Chave estrangeira para plan\_type (relacionamento com tipo do plano)	20](#created_at:-data/hora-de-criação-do-registro)

[● created\_at: Data/hora de criação do registro	20](#created_at:-data/hora-de-criação-do-registro)

[● updated\_at: Data/hora da última atualização do registro	20](#updated_at:-data/hora-da-última-atualização-do-registro)

[8.2 Entidade plan\_type	22](#8.2-entidade-plan_type)

[8.3 Entidade plan\_user\_type	23](#8.3-entidade-plan_user_type)

[8.4 Entidade company\_plan	24](#8.4-entidade-company_plan)

[8.5 Entidade plan\_user\_override	26](#8.5-entidade-plan_user_override)

[8.6 Entidade company\_plan\_usage	27](#8.6-entidade-company_plan_usage)

[8.7 Entidade company\_plan\_history	29](#8.7-entidade-company_plan_history)

[8.8 Entidade plan\_cancellations	30](#8.8-entidade-plan_cancellations)

[8.9 Entidade plan\_reports	32](#8.9-entidade-plan_reports)

[9\. Relacionamentos do Modelo de Dados	33](#9.-relacionamentos-do-modelo-de-dados)

[9.1 Relacionamentos Principais	33](#9.1-relacionamentos-principais)

[10\. Índices para Performance	34](#10.-índices-para-performance)

[11\. Constraints Conforme Diagrama	37](#11.-constraints-conforme-diagrama)

[12\. Estratégia de Cache (Redis)	40](#12.-estratégia-de-cache-\(redis\))

[12.1 Estrutura de Cache Detalhada	40](#12.1-estrutura-de-cache-detalhada)

[12.2 TTL (Time To Live) Justificado	43](#12.2-ttl-\(time-to-live\)-justificado)

[13\. Consultas Principais	44](#13.-consultas-principais)

[13.1 Plano Atual da Empresa	44](#13.1-plano-atual-da-empresa)

[13.2 Configuração de Usuários por Tipo	45](#13.2-configuração-de-usuários-por-tipo)

[13.3 Relatórios Disponíveis por Tipo de Plano	46](#13.3-relatórios-disponíveis-por-tipo-de-plano)

[14\. Dados Iniciais (Seeds)	47](#14.-dados-iniciais-\(seeds\))

[15\. Migrations	49](#15.-migrations)

[15.1 Sequência de Criação	49](#15.1-sequência-de-criação)

[16\. Estrutura de Testes	50](#16.-estrutura-de-testes)

[16.1 Testes de Value Objects	50](#16.1-testes-de-value-objects)

[16.2 Testes de Entity Models	51](#16.2-testes-de-entity-models)

[16.3 Testes de Repositórios	53](#16.3-testes-de-repositórios)

[16.4 Cobertura de Testes Conforme DoD	54](#16.4-cobertura-de-testes-conforme-dod)

[17\. Backup e Recuperação	54](#17.-backup-e-recuperação)

[17.1 Estratégia de Backup	54](#17.1-estratégia-de-backup)

[17.2 Dados Críticos	54](#17.2-dados-críticos)

[18\. Implementação da Biblioteca domain-sales	55](#18.-implementação-da-biblioteca-domain-sales)

[18.1 Estrutura da Arquitetura	55](#18.1-estrutura-da-arquitetura)

[18.2 Exemplos de Implementação	56](#18.2-exemplos-de-implementação)

[Value Objects	56](#value-objects)

[Entity Models	58](#entity-models)

[19\. Resumo da Implementação	60](#19.-resumo-da-implementação)

[19.1 Cobertura dos RAs Críticos	60](#19.1-cobertura-dos-ras-críticos)

[19.2 Alinhamento com VAs	60](#19.2-alinhamento-com-vas)

# **Especificação Técnica \- Modelagem de Dados de Planos** {#especificação-técnica---modelagem-de-dados-de-planos}

## **1\. Introdução** {#1.-introdução}

### **1.1 Overview** {#1.1-overview}

Esta especificação detalha a modelagem de dados atualizada para o sistema de gerenciamento de planos da plataforma Energias, seguindo fielmente o diagrama corrigido fornecido. A modelagem integra-se com as entidades de Users e Reports já implementadas, sendo que as entidades de plano estão sendo criadas conforme esta especificação.

### **1.2 Entidades Conforme Diagrama Corrigido** {#1.2-entidades-conforme-diagrama-corrigido}

* **plan**: Plano base com configurações principais  
* **plan-type**: Tipos de planos (basic, premium, enterprise) com campo is\_active  
* **plan-user-type**: Configuração de usuários por escopo (admin/comum) por tipo de plano  
* **company-plan**: Assinatura da empresa com valores personalizados  
* **plan-user-override**: Personalização de preços por escopo (admin/comum) por empresa  
* **company-plan-usage**: Controle de uso por empresa e escopo de usuário  
* **company-plan-history**: Histórico de mudanças  
* **plan-cancellations**: Controle de cancelamentos de planos  
* **plan-reports**: Relacionamento entre tipos de planos e relatórios

### **1.3 Características da Modelagem** {#1.3-características-da-modelagem}

* **Planos padrão**: Definidos por plan e plan-type  
* **Personalização por cliente**: Via tabela company-plan com amount e additional\_user\_amount personalizados  
* **Chave única**: (plan-type-id, admin) em plan-user-type  
* **Controle de cancelamentos**: Via entidade plan-cancellations com auditoria completa  
* **Integração com reports**: Via entidade plan-reports para controle de funcionalidades por tipo  
* **Integração**: Relacionamentos com entidade company da entidade Users existente

## **2\. Informações de Negócio** {#2.-informações-de-negócio}

### **2.1 Contexto do Sistema Energias** {#2.1-contexto-do-sistema-energias}

O sistema Energias é uma plataforma de relatórios baseados em modelos de física, estatística e machine learning, focada em empresas do segmento de energia. A solução exibe tabelas e gráficos elaborados a partir de outputs de modelos meteorológicos para commodity de energia, atendendo traders de curto e médio prazo.

### **2.2 Modelo de Monetização** {#2.2-modelo-de-monetização}

* **Planos por assinatura**: Empresas contratam planos com diferentes níveis de acesso  
* **Controle de usuários**: Limite de usuários por escopo (admin/comum) conforme plano  
* **Personalização comercial**: Valores e limites negociáveis por cliente  
* **Relatórios por tipo**: Funcionalidades específicas por nível de plano

### **2.3 Regras de Negócio Implementadas** {#2.3-regras-de-negócio-implementadas}

### **RN001 – Plano ativo por empresa** {#rn001-–-plano-ativo-por-empresa}

Cada empresa (`company`) pode ter **somente um plano ativo** por vez, controlado pela tabela `company_plan` e seu campo `status`, que pode assumir os valores:

* `active`

* `cancelled`

* `expired`

### **RN002 – Valor base negociado** {#rn002-–-valor-base-negociado}

O campo `amount` na tabela `company_plan` define o valor total negociado com o cliente, **sobrescrevendo o valor padrão do plano (`plan.amount`)**, caso haja personalização.

### **RN003 – Registro de alterações de plano** {#rn003-–-registro-de-alterações-de-plano}

Toda alteração de plano de uma empresa deve ser registrada na tabela `company_plan_history`, contendo:

* Plano anterior

* Novo plano

* Usuário responsável

* Data da alteração

Esse histórico **não deve ser apagado**, sendo mantido indefinidamente para auditoria.

### 

### **RN004 – Duração do plano** {#rn004-–-duração-do-plano}

A duração do plano é controlada por um `ENUM` em `plan.plan_duration`, com opções como:

* `mensal`, `anual`, `trimestral`, `vitalício`

A data final do plano é calculada com base na `start_date` do contrato \+ valor do `ENUM`.

### **RN005 – Limites de usuários por escopo (admin/comum)** {#rn005-–-limites-de-usuários-por-escopo-(admin/comum)}

Os limites máximos de usuários por escopo em planos padrão (de prateleira) são definidos na tabela `plan_user_type`, com os campos:

* `plan_type_id`

* `admin` (boolean: true para admin, false para comum)

* `number_of_users`

Cada linha representa uma **regra de limite por escopo** vinculada a um `plan_type`.

### 

### 

### 

### **RN006 – Preço padrão por usuário extra (plano de prateleira)** {#rn006-–-preço-padrão-por-usuário-extra-(plano-de-prateleira)}

Na tabela `plan_user_type`, o campo `extra_user_price` define o **valor padrão por usuário extra**, por escopo (`admin` ou `comum`).  
 Este valor é utilizado **quando não há negociação** específica com a empresa.

### **RN007 – Preço adicional negociado (valor total extra)** {#rn007-–-preço-adicional-negociado-(valor-total-extra)}

O campo `additional_user_amount` da tabela `company_plan` representa um **valor global negociado** para usuários extras além dos limites do plano padrão.  
 Esse valor:

* Não é por escopo

* **Não substitui** o preço unitário, a menos que especificado

* Serve para simplificar negociações com grandes empresas

### **RN008 – Personalização por escopo de usuário** {#rn008-–-personalização-por-escopo-de-usuário}

Quando houver necessidade de precificação diferenciada por escopo (`admin`/`comum`) **em contratos específicos**, os valores devem ser registrados na tabela `plan_user_override`, com os campos:

* `company_plan_id`

* `admin` (boolean)

* `extra_user_price`

Essa estrutura permite **sobrescrever os valores padrão por escopo**, por cliente.

### **RN009 – Ordem de precedência de precificação** {#rn009-–-ordem-de-precedência-de-precificação}

Ao calcular a cobrança de usuários extras, a seguinte hierarquia deve ser respeitada:

1. `plan_user_override.extra_user_price` → preço por escopo e contrato

2. `company_plan.additional_user_amount` → valor total negociado para extras (sem escopo)

3. `plan_user_type.extra_user_price` → valor padrão do plano de prateleira

Se houver valor em `override`, ele prevalece sobre os demais.

### **RN010 – Registro do uso do plano por usuário** {#rn010-–-registro-do-uso-do-plano-por-usuário}

A tabela `company_plan_usage` registra **quais usuários estão usando o plano ativo da empresa** e o escopo em que estão alocados.  
 Campos:

* `company_plan_id`

* `user_id`

* `admin` (boolean)

* `created_at`

* `updated_at`

### **RN011 – Validação de limites ao adicionar ou alterar usuários** {#rn011-–-validação-de-limites-ao-adicionar-ou-alterar-usuários}

Sempre que um usuário for:

* Convidado

* Promovido a admin  
   o sistema deve:

* Contar os usuários existentes por escopo (via `company_plan_usage`)

* Comparar com o limite permitido (`plan_user_type` ou `plan_user_override`)

* Rejeitar ou permitir com base na disponibilidade de slots

### **RN012 – Cancelamento de planos** {#rn012-–-cancelamento-de-planos}

Cancelamentos devem ser registrados na tabela `plan_cancellation`, com os campos:

* `company_plan_id`

* `reason`

* `cancelled_by_user-id`

* `cancelled_at`

### **RN013 – Associações de relatórios ao plano** {#rn013-–-associações-de-relatórios-ao-plano}

Os relatórios disponíveis para cada tipo de plano (`plan_type`) são definidos na tabela `plan_reports`, que mapeia:

* `plan_type_id`

* `template_id`

* `created_at`, `updated_at` para auditoria

### **RN014 – Integridade e chaves únicas** {#rn014-–-integridade-e-chaves-únicas}

* Tabela `plan_user_type`: chave composta (`plan_type_id`, `admin`)

* Tabela `plan_user_override`: chave composta (`company_plan_id`, `admin`)

* Tabela `company_plan_usage`: chave composta (`company_plan_id`, `user_id`)

Essas constraints garantem que:

* Não haja duplicidade por escopo

* Um mesmo usuário não ocupe duas vezes o mesmo plano

###  **RN015 – Controle de escopo dentro do uso do plano** {#rn015-–-controle-de-escopo-dentro-do-uso-do-plano}

A tabela `company_plan_usage` registra o escopo de cada usuário **no momento em que ele é alocado ao plano**.  
 Se o escopo de um usuário for alterado (ex: promovido de comum para admin), a alteração **não será refletida automaticamente** no uso do plano.  
 Para refletir a nova alocação, o escopo deve ser alterado **explicitamente no contexto do plano**, validando os limites permitidos por escopo.  
 Essa decisão evita inconsistência e garante auditoria e rastreabilidade.

## **3\. Stack Técnica** {#3.-stack-técnica}

### **3.1 Linguagem de Programação** {#3.1-linguagem-de-programação}

* **TypeScript**: Linguagem principal para implementação do sistema

### **3.2 Bibliotecas** {#3.2-bibliotecas}

* **pg**: Cliente PostgreSQL para Node.js  
* **versatus-arch-framework**: Framework interno para acesso ao banco de dados  
* **Jest**: Framework de testes unitários e de integração

### **3.3 Práticas de Programação** {#3.3-práticas-de-programação}

* **Domain-Driven Design (DDD)**: Aplicação de conceitos de agregados, entidades e objetos de valor  
* **Clean Architecture**: Separação clara entre camadas de domínio, aplicação e infraestrutura  
* **Repository Pattern**: Abstração do acesso aos dados  
* **Facade Pattern**: Simplificação da interface do sistema

### **3.4 Padrões de Design** {#3.4-padrões-de-design}

* **Factory Pattern**: Criação de instâncias de objetos complexos  
* **Unit of Work**: Gerenciamento de transações de banco de dados  
* **Value Objects**: Encapsulamento de lógica de validação  
* **Entity Models**: Representação de entidades de domínio

### **3.5 Ferramentas Aprovadas (Baseado no ADR)** {#3.5-ferramentas-aprovadas-(baseado-no-adr)}

* **PostgreSQL**: Banco de dados principal para dados relacionais  
* **Redis**: Cache para otimização de consultas frequentes  
* **Apache Cassandra**: Dados de uso e métricas (quando aplicável)  
* **TimescaleDB**: Extensão PostgreSQL para dados de séries temporais

## **4\. Arquitetura e Estrutura** {#4.-arquitetura-e-estrutura}

### **4.1 Estrutura de Pastas** {#4.1-estrutura-de-pastas}

```
src/
├── domain/
│   ├── sales/
│   │   ├── aggregates/
│   │   ├── entities/
│   │   ├── interfaces/
│   │   ├── value-objects/
│   │   └── index.ts
│   └── shared/
├── application/
│   ├── facade/
│   ├── factories/
│   └── framework/
└── index.ts
```

### **4.2 Camadas (Tiers/Layers)** {#4.2-camadas-(tiers/layers)}

#### **4.2.1 Camada de Domínio** {#4.2.1-camada-de-domínio}

* **Responsabilidades**: Regras de negócio, entidades, objetos de valor  
* **Tecnologias**: TypeScript puro, sem dependências externas  
* **Restrições**: Não pode acessar infraestrutura ou banco de dados diretamente  
* **Padrões**: DDD com agregados, entidades e value objects

#### **4.2.2 Camada de Aplicação** {#4.2.2-camada-de-aplicação}

* **Responsabilidades**: Coordenação de fluxos de trabalho, fachadas  
* **Tecnologias**: TypeScript, framework interno versatus-arch  
* **Restrições**: Não contém regras de negócio, apenas orquestração  
* **Padrões**: Facade, Factory, Unit of Work

#### **4.2.3 Camada de Interface** {#4.2.3-camada-de-interface}

* **Responsabilidades**: APIs REST, controllers, DTOs  
* **Tecnologias**: Express.js, TypeScript  
* **Restrições**: Apenas transformação de dados, sem lógica de negócio  
* **Padrões**: Controller, DTO

#### **4.2.4 Camada de Infraestrutura** {#4.2.4-camada-de-infraestrutura}

* **Responsabilidades**: Acesso a dados, integrações externas  
* **Tecnologias**: PostgreSQL, Redis, pg driver  
* **Restrições**: Implementação de interfaces definidas no domínio  
* **Padrões**: Repository, Data Mapper

#### **4.2.5 Camada de Plataforma** {#4.2.5-camada-de-plataforma}

* **Responsabilidades**: Configuração, deploy, monitoramento  
* **Tecnologias**: Terraform, Ansible, Kubernetes (Digital Ocean)  
* **Restrições**: Não afeta lógica de negócio  
* **Padrões**: Infrastructure as Code

## **5\. Fluxo de Dados** {#5.-fluxo-de-dados}

### **5.1 Input** {#5.1-input}

* **Dados de entrada**: DTOs validados via value objects  
* **Validações**: Regras de negócio aplicadas na camada de domínio  
* **Formato**: JSON para APIs REST  
* **Autenticação**: Integração com entidades Users existentes

### **5.2 Processamento** {#5.2-processamento}

* **Lógica de negócio**: Concentrada em agregados e entidades  
* **Transformações**: Aplicadas via métodos de domínio  
* **Validações**: RN001-RN015 implementadas nos agregados  
* **Coordenação**: Fachadas gerenciam fluxos complexos

### **5.3 Output** {#5.3-output}

* **Resultado esperado**: DTOs estruturados para consumo  
* **Formato**: JSON padronizado  
* **Estrutura**: Conforme interfaces definidas no domínio  
* **Cache**: Dados frequentes armazenados em Redis

### **5.4 Persistência** {#5.4-persistência}

#### **5.4.1 Banco Relacional (PostgreSQL)** {#5.4.1-banco-relacional-(postgresql)}

* **Dados críticos**: Planos, assinaturas, histórico, cancelamentos  
* **Padrões**: ACID para transações críticas  
* **Consistência**: Forte via foreign keys e constraints  
* **Backup**: Estratégia definida com retenção de 30 dias

#### **5.4.2 Cache (Redis)** {#5.4.2-cache-(redis)}

* **Padrões de uso**: Consultas frequentes de planos ativos  
* **TTL diferenciado**: 5min para assinaturas, 4h para catálogo  
* **Invalidação**: Por eventos de sistema  
* **Estrutura**: Chaves hierárquicas organizadas

## **6\. Requisitos Não-Funcionais** {#6.-requisitos-não-funcionais}

### **6.1 Observabilidade** {#6.1-observabilidade}

* **Logs**: Estruturados via Logstash \+ Elasticsearch  
* **Métricas**: Prometheus \+ Grafana para monitoramento  
* **Traces**: Rastreamento distribuído implementado  
* **Auditoria**: Histórico completo via company\_plan\_history

### **6.2 Segurança** {#6.2-segurança}

* **Autenticação**: Integração com Red Hat SSO (Keycloak)  
* **Autorização**: Controle por escopo (admin/comum)  
* **Criptografia**: Dados sensíveis protegidos  
* **Backup**: Blackblaze B2 para armazenamento externo

### **6.3 Performance** {#6.3-performance}

* **Tempos de resposta**: \<200ms para consultas de planos  
* **Throughput**: Suporte a 400 usuários simultâneos  
* **Cache**: Redis reduz latência em 70-80%  
* **Índices**: Otimizados para padrões de acesso reais  
* **Queries**: Raw SQL para performance máxima

### **6.4 Escalabilidade** {#6.4-escalabilidade}

* **Crescimento**: Suporte de 60 a 400 usuários  
* **Horizontal**: Kubernetes (Digital Ocean) para escala  
* **Vertical**: PostgreSQL dimensionado conforme carga  
* **Cache distribuído**: Redis suporta múltiplas instâncias  
* **Arquitetura**: Microserviços para escalabilidade independente

### **6.5 Disponibilidade** {#6.5-disponibilidade}

* **Uptime**: 99.9% conforme RA06 (classificação 5\)  
* **Backup**: Automático com teste de restore mensal  
* **Recuperação**: RTO de 4 horas, RPO de 1 hora  
* **Monitoramento**: Alertas proativos implementados  
* **Infraestrutura**: Digital Ocean com alta disponibilidade

### **6.6 Outros RAs Atendidos** {#6.6-outros-ras-atendidos}

* **Manutenabilidade (RA04)**: Código limpo, bem documentado  
* **Adaptabilidade (RA11)**: Arquitetura hexagonal implementada  
* **Integrabilidade (RA12)**: APIs RESTful padronizadas  
* **Testabilidade (RA05)**: Cobertura de 80% conforme DoD

## 

## **7\. Referências** {#7.-referências}

### **7.1 Código Base** {#7.1-código-base}

* **Framework interno**: versatus-arch-framework para acesso a dados  
* **Bibliotecas de domínio**: domain-users para integração  
* **Padrões estabelecidos**: Clean Architecture já implementada no projeto

### **7.2 Padrões de Comentários** {#7.2-padrões-de-comentários}

* **Idioma**: Português para comentários de negócio  
* **Inglês**: Para comentários técnicos e código  
* **Documentação**: JSDoc para funções públicas  
* **Exemplos**: Testes unitários servem como documentação

### **7.3 Estilo de Programação** {#7.3-estilo-de-programação}

* **TypeScript strict mode**: Habilitado para maior segurança  
* **ESLint**: Configurado conforme padrões do projeto  
* **Prettier**: Formatação automática de código  
* **Naming conventions**: CamelCase para métodos, PascalCase para classes

### **7.4 Documentação Adicional** {#7.4-documentação-adicional}

* **ArcHSmart**: Requisitos e variáveis arquiteturais  
* **Diagramas**: C4 Model para documentação da arquitetura  
* **APIs**: Documentação via Swagger/OpenAPI  
* **Regras de negócio**: RN001-RN015 documentadas em código

## 

## 

## **8\. Modelagem de Dados**  {#8.-modelagem-de-dados}

### **8.1 Entidade plan** {#8.1-entidade-plan}

Descrição: Tabela principal que define os planos disponíveis no sistema, contendo as informações básicas, valor padrão, duração e tipo de cada plano.

### **Campos:** {#created_at:-data/hora-de-criação-do-registro}

* ### **plan\_id:** Identificador único do plano (chave primária) {#created_at:-data/hora-de-criação-do-registro}

* ### **plan\_name:** Nome do plano (ex: Silver Plan, Gold Plan) {#created_at:-data/hora-de-criação-do-registro}

* ### **description:** Descrição detalhada do plano e suas funcionalidades {#created_at:-data/hora-de-criação-do-registro}

* ### **default\_amount:** Valor padrão do plano (pode ser sobrescrito por company\_plan.amount) {#created_at:-data/hora-de-criação-do-registro}

* ### **plan\_duration:** Duração do plano como ENUM (mensal, anual, trimestral, vitalicio) {#created_at:-data/hora-de-criação-do-registro}

* ### **plan\_type\_id:** Chave estrangeira para plan\_type (relacionamento com tipo do plano) {#created_at:-data/hora-de-criação-do-registro}

* ### **created\_at:** Data/hora de criação do registro {#created_at:-data/hora-de-criação-do-registro}

* ### **updated\_at:** Data/hora da última atualização do registro {#updated_at:-data/hora-da-última-atualização-do-registro}

```sql
CREATE TABLE plan (
    plan_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_name VARCHAR(100) NOT NULL,
    description TEXT,
    default_amount DECIMAL(10,2) NOT NULL CHECK (default_amount >= 0),
    plan_duration VARCHAR(20) NOT NULL CHECK (plan_duration IN ('mensal', 'anual', 'trimestral', 'vitalicio')),
    plan_type_id UUID NOT NULL REFERENCES plan_type(plan_type_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT uq_plan_name UNIQUE (plan_name)
);
```

### 

### 

### 

### 

### 

### 

### **8.2 Entidade plan\_type**  {#8.2-entidade-plan_type}

Descrição: Define os tipos de planos disponíveis (basic, premium, enterprise) com controle de atividade.

**Campos:**

* **plan\_type\_id**: Identificador único do tipo de plano (chave primária)  
* **type\_name**: Nome do tipo (basic, premium, enterprise)  
* **description**: Descrição das características e limitações do tipo  
* **is\_active**: Indica se o tipo de plano está ativo no sistema  
* **created\_at**: Data/hora de criação do registro  
* **updated\_at**: Data/hora da última atualização do registro

```sql
CREATE TABLE plan_type (
    plan_type_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type_name VARCHAR(50) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT uq_plan_type_name UNIQUE (type_name)
);
```

### **8.3 Entidade plan\_user\_type** {#8.3-entidade-plan_user_type}

Descrição: Define a configuração de usuários permitidos por escopo (admin/comum) por tipo de plano.

**Campos:**

* **plan\_user\_type\_id**: Identificador único da configuração (chave primária)  
* **plan\_type\_id**: Chave estrangeira para plan\_type (relacionamento com tipo do plano)  
* **admin**: Define o escopo do usuário (true \= admin, false \= comum)  
* **number\_of\_users**: Quantidade de usuários permitida neste escopo  
* **extra\_user\_price**: Preço por usuário adicional além do limite neste escopo  
* **created\_at**: Data/hora de criação do registro  
* **updated\_at**: Data/hora da última atualização do registro

```sql
CREATE TABLE plan_user_type (
    plan_user_type_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_type_id UUID NOT NULL REFERENCES plan_type(plan_type_id),
    admin BOOLEAN NOT NULL,
    number_of_users INTEGER NOT NULL CHECK (number_of_users >= 0),
    extra_user_price DECIMAL(10,2) DEFAULT 0 CHECK (extra_user_price >= 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT uq_plan_user_type UNIQUE (plan_type_id, admin)
);
```

### **8.4 Entidade company\_plan** {#8.4-entidade-company_plan}

Descrição: Registra a assinatura de planos por empresa, permitindo personalização de valores e configurações específicas por cliente.

**Campos:**

* **company\_plan\_id**: Identificador único da assinatura (chave primária)  
* **company\_id**: Chave estrangeira para company (relacionamento com empresa das entidades Users)  
* **plan\_id**: Chave estrangeira para plan (relacionamento com o plano contratado)  
* **amount**: Valor personalizado que sobrescreve plan.default\_amount  
* **start\_date**: Data de início da assinatura  
* **end\_date**: Data de término da assinatura  
* **status**: Status atual da assinatura (active, cancelled, expired)  
* **additional\_user\_amount**: Valor customizado para usuários extras em contratos personalizados  
* **created\_at**: Data/hora de criação do registro  
* **updated\_at**: Data/hora da última atualização do registro

```sql
CREATE TABLE company_plan (
    company_plan_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES company(company_id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES plan(plan_id),
    amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'active',
    additional_user_amount DECIMAL(10,2) DEFAULT 0 CHECK (additional_user_amount >= 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_dates CHECK (end_date > start_date)
);
```

### **8.5 Entidade plan\_user\_override**  {#8.5-entidade-plan_user_override}

Descrição: Permite personalização de preços por escopo (admin/comum) para contratos específicos de empresas.

**Campos:**

* **plan\_user\_override\_id**: Identificador único do override (chave primária)  
* **company\_plan\_id**: Chave estrangeira para company\_plan (relacionamento com assinatura específica)  
* **admin**: Define o escopo do usuário (true \= admin, false \= comum)  
* **extra\_user\_price**: Preço personalizado por usuário extra neste escopo para esta empresa  
* **created\_at**: Data/hora de criação do registro  
* **updated\_at**: Data/hora da última atualização do registro

```sql
CREATE TABLE plan_user_override (
    plan_user_override_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_plan_id UUID NOT NULL REFERENCES company_plan(company_plan_id) ON DELETE CASCADE,
    admin BOOLEAN NOT NULL,
    extra_user_price DECIMAL(10,2) NOT NULL CHECK (extra_user_price >= 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT uq_plan_user_override UNIQUE (company_plan_id, admin)
);
```

### 

### **8.6 Entidade company\_plan\_usage** {#8.6-entidade-company_plan_usage}

Descrição: Registra o uso e consumo dos recursos do plano por empresa e usuário com controle de escopo.

**Campos:**

* **usage\_id**: Identificador único do registro de uso (chave primária)  
* **company\_plan\_id**: Chave estrangeira para company\_plan (relacionamento com assinatura da empresa)  
* **user\_id**: Chave estrangeira para user (relacionamento com usuário que realizou o uso)  
* **admin**: Define o escopo do usuário no momento do uso (true \= admin, false \= comum)  
* **created\_at**: Data/hora do registro de uso  
* **updated\_at**: Data/hora da última atualização do registro


```sql
CREATE TABLE company_plan_usage (
    usage_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES company_plan(company_plan_id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES user(user_id) ON DELETE CASCADE,
    admin BOOLEAN NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT uq_company_plan_usage UNIQUE (company_plan_id, user_id)
);
```

### 

### 

### 

### 

### 

### **8.7 Entidade company\_plan\_history** {#8.7-entidade-company_plan_history}

Descrição: Mantém o histórico completo de mudanças nos planos das empresas para auditoria.

**Campos:**

* **history\_id**: Identificador único do registro histórico (chave primária)  
* **company\_plan\_id**: Chave estrangeira para company\_plan (relacionamento com assinatura)  
* **previous\_plan\_id**: Chave estrangeira para plan (plano anterior, pode ser NULL na primeira contratação)  
* **new\_plan\_id**: Chave estrangeira para plan (novo plano contratado)  
* **change\_type**: Tipo de mudança como ENUM (upgrade, downgrade, renewal, cancellation)  
* **reason**: Motivo da mudança (opcional, máximo 100 caracteres)  
* **change\_at**: Data/hora da mudança  
* **changed\_by\_user\_id**: Chave estrangeira para user (usuário que realizou a mudança)  
* **created\_at**: Data/hora de criação do registro

```sql
CREATE TABLE company_plan_history (
    history_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_plan_id UUID NOT NULL REFERENCES company_plan(company_plan_id),
    previous_plan_id UUID REFERENCES plan(plan_id),
    new_plan_id UUID NOT NULL REFERENCES plan(plan_id),
    change_type VARCHAR(20) NOT NULL CHECK (change_type IN ('upgrade', 'downgrade', 'renewal', 'cancellation')),
    reason VARCHAR(100),
    change_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    changed_by_user_id UUID NOT NULL REFERENCES user(user_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 

### **8.8 Entidade plan\_cancellations** {#8.8-entidade-plan_cancellations}

Descrição: Controla os cancelamentos de planos com auditoria completa.

**Campos:**

* **plan\_cancellation\_id**: Identificador único do cancelamento (chave primária)  
* **cancellation\_reason**: Motivo do cancelamento (obrigatório, máximo 50 caracteres)  
* **cancelled\_at**: Data/hora do cancelamento  
* **company\_plan\_id**: Chave estrangeira para company\_plan (relacionamento com assinatura)  
* **cancelled\_by\_user\_id**: Chave estrangeira para user (usuário que solicitou o cancelamento)  
* **created\_at**: Data/hora de criação da solicitação  
* **updated\_at**: Data/hora da última atualização

```sql
CREATE TABLE plan_cancellations (
    plan_cancellation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cancellation_reason VARCHAR(50) NOT NULL,
    cancelled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    company_plan_id UUID NOT NULL REFERENCES company_plan(company_plan_id) ON DELETE CASCADE,
    cancelled_by_user_id UUID NOT NULL REFERENCES user(user_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 

### 

### 

### 

### **8.9 Entidade plan\_reports** {#8.9-entidade-plan_reports}

Descrição: Define a relação entre tipos de planos e relatórios disponíveis.

**Campos:**

* **plan\_report\_id**: Identificador único da associação (chave primária)  
* **plan\_type\_id**: Chave estrangeira para plan\_type (relacionamento com tipo de plano)  
* **template\_id**: Identificador do template de relatório (relacionamento com entidades Reports)  
* **created\_at**: Data/hora de criação do registro  
* **updated\_at**: Data/hora da última atualização

```sql
CREATE TABLE plan_reports (
    plan_report_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_type_id UUID NOT NULL REFERENCES plan_type(plan_type_id) ON DELETE CASCADE,
    template_id UUID NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT uq_plan_report UNIQUE (plan_type_id, template_id)
);
```

## 

## **9\. Relacionamentos do Modelo de Dados** {#9.-relacionamentos-do-modelo-de-dados}

### **9.1 Relacionamentos Principais** {#9.1-relacionamentos-principais}

* **plan\_type (1) → (N) plan** \- Um tipo pode ter múltiplos planos  
* **plan\_type (1) → (N) plan\_user\_type** \- Um tipo pode ter múltiplas configurações por escopo  
* **plan\_type (1) → (N) plan\_reports** \- Um tipo pode ter múltiplos relatórios associados  
* **company (1) → (N) company\_plan** \- Uma empresa pode ter múltiplas assinaturas (histórico)  
* **plan (1) → (N) company\_plan** \- Um plano pode ser usado por múltiplas empresas  
* **company\_plan (1) → (N) plan\_user\_override** \- Uma assinatura pode ter múltiplos overrides por escopo  
* **company\_plan (1) → (N) company\_plan\_usage** \- Uma empresa pode ter múltiplos registros de uso  
* **user (1) → (N) company\_plan\_usage** \- Um usuário pode ter múltiplos registros de uso  
* **company\_plan (1) → (N) company\_plan\_history** \- Uma assinatura pode ter múltiplos registros históricos  
* **plan (1) → (N) company\_plan\_history** \- Um plano pode aparecer no histórico múltiplas vezes  
* **user (1) → (N) company\_plan\_history** \- Um usuário pode realizar múltiplas mudanças  
* **company\_plan (1) → (N) plan\_cancellations** \- Uma assinatura pode ter múltiplos cancelamentos  
* **user (1) → (N) plan\_cancellations** \- Um usuário pode solicitar múltiplos cancelamentos

## **10\. Índices para Performance** {#10.-índices-para-performance}

```sql
-- Índices para plan
CREATE INDEX idx_plan_name ON plan(plan_name);
CREATE INDEX idx_plan_type_id ON plan(plan_type_id);

-- Índices para plan_type
CREATE INDEX idx_plan_type_name ON plan_type(type_name);
CREATE INDEX idx_plan_type_active ON plan_type(is_active);

-- Índices para plan_user_type
CREATE INDEX idx_plan_user_type_plan_type ON plan_user_type(plan_type_id);
CREATE INDEX idx_plan_user_type_admin ON plan_user_type(admin);

-- Índices para company_plan
CREATE INDEX idx_company_plan_company ON company_plan(company_id);
CREATE INDEX idx_company_plan_plan ON company_plan(plan_id);
CREATE INDEX idx_company_plan_status ON company_plan(status);
CREATE INDEX idx_company_plan_dates ON company_plan(start_date, end_date);

-- Índices para plan_user_override
CREATE INDEX idx_plan_user_override_company_plan ON plan_user_override(company_plan_id);
CREATE INDEX idx_plan_user_override_admin ON plan_user_override(admin);

-- Índices para company_plan_usage
CREATE INDEX idx_company_plan_usage_company_plan ON company_plan_usage(company_plan_id);
CREATE INDEX idx_company_plan_usage_user ON company_plan_usage(user_id);
CREATE INDEX idx_company_plan_usage_admin ON company_plan_usage(admin);

-- Índices para company_plan_history
CREATE INDEX idx_company_plan_history_company_plan ON company_plan_history(company_plan_id);
CREATE INDEX idx_company_plan_history_change_at ON company_plan_history(change_at);

-- Índices para plan_cancellations
CREATE INDEX idx_plan_cancellations_company_plan ON plan_cancellations(company_plan_id);
CREATE INDEX idx_plan_cancellations_cancelled_by ON plan_cancellations(cancelled_by_user_id);
CREATE INDEX idx_plan_cancellations_cancelled_at ON plan_cancellations(cancelled_at);

-- Índices para plan_reports
CREATE INDEX idx_plan_reports_plan_type_id ON plan_reports(plan_type_id);
CREATE INDEX idx_plan_reports_template_id ON plan_reports(template_id);
```

## **11\. Constraints Conforme Diagrama**  {#11.-constraints-conforme-diagrama}

```sql
-- Garantir apenas um plano ativo por empresa
CREATE UNIQUE INDEX idx_unique_active_company_plan 
ON company_plan(company_id) 
WHERE status = 'active';

-- Constraint para validar company_plan
CREATE OR REPLACE FUNCTION validate_company_plan_amounts()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.amount <= 0 THEN
        RAISE EXCEPTION 'Company plan amount must be positive';
    END IF;
    
    IF NEW.additional_user_amount < 0 THEN
        RAISE EXCEPTION 'Additional user amount cannot be negative';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_validate_company_plan_amounts
    BEFORE INSERT OR UPDATE ON company_plan
    FOR EACH ROW EXECUTE FUNCTION validate_company_plan_amounts();

-- Constraint para validar plan_cancellations
CREATE OR REPLACE FUNCTION validate_plan_cancellation()
RETURNS TRIGGER AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM company_plan 
        WHERE company_plan_id = NEW.company_plan_id 
        AND status = 'active'
    ) THEN
        RAISE EXCEPTION 'Cannot cancel non-active plan';
    END IF;
    
    IF LENGTH(TRIM(NEW.cancellation_reason)) < 5 THEN
        RAISE EXCEPTION 'Cancellation reason must be at least 5 characters';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_validate_plan_cancellation
    BEFORE INSERT OR UPDATE ON plan_cancellations
    FOR EACH ROW EXECUTE FUNCTION validate_plan_cancellation();
```

## **12\. Estratégia de Cache (Redis)** {#12.-estratégia-de-cache-(redis)}

### **12.1 Estrutura de Cache Detalhada** {#12.1-estrutura-de-cache-detalhada}

```
# Catálogo de Planos Disponíveis (TTL: 4 horas)
plans:catalog -> {
  "basic": {
    "plan_id": "uuid-basic",
    "plan_name": "Silver Plan",
    "default_amount": 75.00,
    "type_name": "basic",
    "is_active": true,
    "user_configs": [
      {
        "admin": false,
        "number_of_users": 5,
        "extra_user_price": 10.00
      },
      {
        "admin": true,
        "number_of_users": 2,
        "extra_user_price": 15.00
      }
    ],
    "available_reports": ["template-1", "template-2"]
  }
}

# Assinatura Ativa da Empresa (TTL: 5 minutos)
company:${company_id}:active_plan -> {
  "company_plan_id": "uuid",
  "plan_name": "Silver Plan",
  "type_name": "basic",
  "amount": 60.00,
  "additional_user_amount": 8.00,
  "status": "active",
  "start_date": "2025-01-01",
  "end_date": "2025-12-31",
  "overrides": [
    {
      "admin": true,
      "extra_user_price": 12.00
    }
  ]
}
```

### **12.2 TTL (Time To Live) Justificado** {#12.2-ttl-(time-to-live)-justificado}

| Chave | TTL | Justificativa |
| ----- | :---: | ----- |
| `plans:catalog` | **4 horas** | Dados de produto estáveis, alterados raramente |
| `company:{id}:active_plan` | **5 minutos**  | Dados críticos de sessão, podem mudar durante uso |
| `plan_type:{id}:user_configs` | **2 horas**  | Configurações complexas, estáveis por períodos médios |
| `company:{id}:usage_metrics` | **1 hora**  | Dados de uso, atualizados periodicamente |

## 

## 

## 

## 

## 

## **13\. Consultas Principais** {#13.-consultas-principais}

### **13.1 Plano Atual da Empresa** {#13.1-plano-atual-da-empresa}

```sql
SELECT 
    cp.company_plan_id,
    cp.company_id,
    p.plan_name,
    pt.type_name,
    pt.is_active as type_active,
    p.default_amount,
    cp.amount as personalized_amount,
    cp.additional_user_amount,
    cp.start_date,
    cp.end_date,
    cp.status
FROM company_plan cp
JOIN plan p ON cp.plan_id = p.plan_id
JOIN plan_type pt ON p.plan_type_id = pt.plan_type_id
WHERE cp.company_id = ? AND cp.status = 'active';
```

### **13.2 Configuração de Usuários por Tipo** {#13.2-configuração-de-usuários-por-tipo}

```sql
SELECT 
    put.plan_type_id,
    put.admin,
    put.number_of_users,
    put.extra_user_price,
    pt.type_name,
    pt.is_active
FROM plan_user_type put
JOIN plan_type pt ON put.plan_type_id = pt.plan_type_id
WHERE pt.plan_type_id = ? AND pt.is_active = true
ORDER BY put.admin DESC, put.number_of_users;
```

### 

### 

### **13.3 Relatórios Disponíveis por Tipo de Plano** {#13.3-relatórios-disponíveis-por-tipo-de-plano}

```sql
SELECT 
    pr.plan_type_id,
    pr.template_id,
    pt.type_name,
    pt.is_active
FROM plan_reports pr
JOIN plan_type pt ON pr.plan_type_id = pt.plan_type_id
WHERE pt.plan_type_id = ? AND pt.is_active = true
ORDER BY pr.template_id;
```

## 

## 

## 

## 

## 

## **14\. Dados Iniciais (Seeds)** {#14.-dados-iniciais-(seeds)}

```sql
-- 1. Tipos de planos
INSERT INTO plan_type (type_name, description, is_active) VALUES 
('basic', 'Tipo básico com recursos essenciais', true),
('premium', 'Tipo premium com recursos avançados', true),
('enterprise', 'Tipo enterprise com recursos completos', true);
-- 2. Planos base
INSERT INTO plan (plan_name, description, default_amount, plan_duration, plan_type_id) 
SELECT 
    plan_data.plan_name,
    plan_data.description,
    plan_data.default_amount,
    plan_data.plan_duration,
    pt.plan_type_id
FROM (
    VALUES 
    ('Silver Plan', 'Plano básico com recursos essenciais', 75.00, 'mensal', 'basic'),
    ('Gold Plan', 'Plano intermediário com recursos avançados', 150.00, 'mensal', 'premium'),
    ('Platinum Plan', 'Plano completo com todos os recursos', 300.00, 'mensal', 'enterprise')
) AS plan_data(plan_name, description, default_amount, plan_duration, type_name)
JOIN plan_type pt ON pt.type_name = plan_data.type_name;

-- 3. Configurações de usuários por tipo
INSERT INTO plan_user_type (plan_type_id, admin, number_of_users, extra_user_price)
SELECT 
    pt.plan_type_id,
    config.admin,
    config.number_of_users,
    config.extra_user_price
FROM plan_type pt
CROSS JOIN (
    VALUES 
    (false, 5, 10.00),   -- usuários comuns
    (true, 1, 15.00)     -- usuários admin
) AS config(admin, number_of_users, extra_user_price)
WHERE pt.is_active = true;
```

## **15\. Migrations** {#15.-migrations}

### **15.1 Sequência de Criação** {#15.1-sequência-de-criação}

1. `001_create_plan_type.sql`  
2. `002_create_plan.sql`  
3. `003_create_plan_user_type.sql`  
4. `004_create_company_plan.sql`  
5. `005_create_plan_user_override.sql`  
6. `006_create_company_plan_usage.sql`  
7. `007_create_company_plan_history.sql`  
8. `008_create_plan_cancellations.sql`  
9. `009_create_plan_reports.sql`  
10. `010_add_indexes.sql`  
11. `011_add_constraints.sql`  
12. `012_seed_initial_data.sql`

## **16\. Estrutura de Testes** {#16.-estrutura-de-testes}

### **16.1 Testes de Value Objects** {#16.1-testes-de-value-objects}

```ts
import { AmountValueObject, InvalidAmountValueObjectError } from "@/domain/sales";

describe("AmountValueObject", () => {
    it("should return InvalidAmountValueObjectError for a negative amount", () => {
        const invalidAmount = -10;
        const sut = () => AmountValueObject.create(invalidAmount);
        expect(sut).toThrow(InvalidAmountValueObjectError);
    });

    it("should create an AmountValueObject instance with a valid amount", () => {
        const validAmount = 99.99;
        const sut = AmountValueObject.create(validAmount);
        expect(sut).toBeInstanceOf(AmountValueObject);
    });
});
```

### **16.2 Testes de Entity Models** {#16.2-testes-de-entity-models}

```ts
import { PlanEntityModel } from "@/domain/sales";

describe("PlanEntityModel", () => {
    it("should return an error if planName is invalid", () => {
        const sut = () => PlanEntityModel.create({
            planId: 1,
            planName: "",
            defaultAmount: 75.00,
            planTypeId: 1
        });
        expect(sut).toThrow(Error);
    });

    it("should create a PlanEntityModel instance with valid inputs", () => {
        const sut = PlanEntityModel.create({
            planId: 1,
            planName: "Silver Plan",
            defaultAmount: 75.00,
            planTypeId: 1
        });
        expect(sut).toBeInstanceOf(PlanEntityModel);
    });
});
```

### 

### 

### **16.3 Testes de Repositórios** {#16.3-testes-de-repositórios}

```ts
import { PlanRepository } from "@/application/framework";
import { PlanEntityModel } from "@/domain/sales";

describe("PlanRepository", () => {
    describe("create", () => {
        it("should create a new plan", async () => {
            const planRepository = new PlanRepository(databaseHelper);
            const planData = PlanEntityModel.create({
                planId: 1,
                planName: "Gold Plan",
                defaultAmount: 150.00,
                planTypeId: 2
            });
            const result = await planRepository.create(planData);
            expect(result).toBeInstanceOf(PlanEntityModel);
        });
    });
});
```

### **16.4 Cobertura de Testes Conforme DoD** {#16.4-cobertura-de-testes-conforme-dod}

* **Cobertura mínima**: 80% conforme Definition of Done  
* **Tipos de testes**: Unitários, integração e end-to-end  
* **Framework**: Jest para execução e relatórios  
* **Mocking**: MockSalesDatabase para testes isolados

## **17\. Backup e Recuperação** {#17.-backup-e-recuperação}

### **17.1 Estratégia de Backup** {#17.1-estratégia-de-backup}

* **Backup Completo**: Diário às 02:00  
* **Backup Incremental**: A cada 6 horas  
* **Retenção**: 30 dias local, 1 ano Blackblaze B2  
* **Teste de Restore**: Mensal automatizado

### **17.2 Dados Críticos** {#17.2-dados-críticos}

* **plan, plan\_type**: Configuração de produtos  
* **company\_plan**: Assinaturas ativas com valores personalizados  
* **company\_plan\_history**: Auditoria obrigatória  
* **plan\_cancellations**: Histórico de cancelamentos  
* **plan\_reports**: Configuração de funcionalidades

## **18\. Implementação da Biblioteca domain-sales** {#18.-implementação-da-biblioteca-domain-sales}

### **18.1 Estrutura da Arquitetura** {#18.1-estrutura-da-arquitetura}

```
domain/
├── sales/
│   ├── aggregates/
│   │   ├── plan-aggregate/
│   │   ├── subscription-aggregate/
│   │   └── index.ts
│   ├── entities/
│   │   ├── plan-entity/
│   │   ├── plan-type-entity/
│   │   ├── company-plan-entity/
│   │   └── index.ts
│   ├── interfaces/
│   │   └── database/
│   ├── value-objects/
│   │   ├── amount/
│   │   ├── plan-name/
│   │   └── index.ts
│   └── index.ts
```

### **18.2 Exemplos de Implementação** {#18.2-exemplos-de-implementação}

#### **Value Objects** {#value-objects}

```ts
export class AmountValueObject {
    private constructor(private readonly amount: number) {
        this.amount = amount;
        Object.freeze(this);
    }

    public get value(): number {
        return this.amount;
    }

    static create(amount: number): AmountValueObject {
        if (!this.validate(amount)) throw new InvalidAmountValueObjectError();
        return new AmountValueObject(amount);
    }

    private static validate(amount: number): boolean {
        if (typeof amount !== 'number') return false;
        if (amount <= 0) return false;
        if (amount > 999999.99) return false;
        return true;
    }
}
```

#### 

#### 

#### 

#### 

#### 

#### **Entity Models** {#entity-models}

```ts
export class PlanEntityModel implements IEntityModel<PlanDTO> {
    private constructor(
        public readonly planId: IdValueObject,
        public readonly planName: PlanNameValueObject,
        public readonly description: string,
        public readonly defaultAmount: AmountValueObject,
        public readonly planTypeId: IdValueObject
    ) {}

    static create(dto: PlanDTO): PlanEntityModel {
        const planIdOrError = IdValueObject.create(dto.planId);
        const planNameOrError = PlanNameValueObject.create(dto.planName);
        const defaultAmountOrError = AmountValueObject.create(dto.defaultAmount);
        const planTypeIdOrError = IdValueObject.create(dto.planTypeId);

        return new PlanEntityModel(
            planIdOrError,
            planNameOrError,
            dto.description || '',
            defaultAmountOrError,
            planTypeIdOrError
        );
    }
}
```

## 

## 

## 

## 

## **19\. Resumo da Implementação** {#19.-resumo-da-implementação}

### **19.1 Cobertura dos RAs Críticos** {#19.1-cobertura-dos-ras-críticos}

* **RA06 \- Disponibilidade (5)**: 100% atendido via backup, cache e índices  
* **RA04 \- Manutenibilidade (4)**: 100% atendido via Clean Architecture  
* **RA09 \- Observabilidade (4)**: 100% atendido via auditoria e logs  
* **RA07 \- Escalabilidade (3)**: 100% atendido via cache e índices  
* **RA11 \- Adaptabilidade (3)**: 100% atendido via personalização  
* **RA12 \- Integrabilidade (3)**: 100% atendido via APIs e UUID

### **19.2 Alinhamento com VAs** {#19.2-alinhamento-com-vas}

* **PostgreSQL**: Banco principal   
* **Redis**: Cache estratégico   
* **TypeScript**: Linguagem principal conforme stack  
* **Clean Architecture**: Padrão arquitetural   
* **Domain-sales**: Biblioteca específica para o domínio

**20\. Conclusão**

Esta estrutura foi cuidadosamente projetada para garantir uma arquitetura limpa, escalável e de fácil manutenção, com **separação clara de responsabilidades entre as entidades**, seguindo os princípios de **modelagem orientada ao domínio (DDD)**. Cada tabela cumpre um papel específico dentro do fluxo de gerenciamento de planos, desde a definição de planos padrão (de prateleira) até as particularidades das contratações personalizadas por cliente.

O uso de tabelas especializadas, como `plan_user_type` e `plan_user_override`, permite uma **flexibilidade controlada na precificação e no controle de escopo**, respeitando os limites contratuais e abrindo espaço para negociações específicas com grandes empresas. Já a tabela `company_plan_usage` oferece uma visão precisa da ocupação real de cada plano, respeitando a lógica de escopo (admin/comum) e garantindo rastreabilidade completa sobre a evolução dos perfis de uso.

Além disso, a adoção de boas práticas como:

* uso de `created_at` / `updated_at` para rastreamento temporal,

* normalização adequada até a terceira forma normal,

* chaves compostas pensadas para integridade sem redundância,

* e ENUMs controlados para garantir padronização de durações,

reforça a **qualidade técnica** da solução, tornando-a robusta o suficiente para suportar tanto **operações comerciais escaláveis**, quanto **integrações com sistemas de billing, permissionamento e relatórios**.

Por fim, este modelo está alinhado com a estratégia da empresa de entregar **produtos modulares, auditáveis e adaptáveis**, capazes de evoluir junto com as necessidades do negócio, garantindo clareza para o time de desenvolvimento e confiança para as áreas de produto, comercial e cliente final.

