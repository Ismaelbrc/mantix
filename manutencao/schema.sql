-- ================================================================
-- MANTIX — Schema do Banco de Dados
-- Banco: philosbrteste | Host: mysql.philosbr-teste.com.br
-- Todas as tabelas usam prefixo tbli_
-- ================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------------------------------------------
-- tbli_maquinas
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `tbli_maquinas` (
  `id`               VARCHAR(64)     NOT NULL,
  `nome`             VARCHAR(255)    NOT NULL DEFAULT '',
  `codigo`           VARCHAR(50)     DEFAULT '',
  `categoria`        VARCHAR(100)    DEFAULT '',
  `criticidade`      VARCHAR(20)     DEFAULT 'media',
  `fabricante`       VARCHAR(100)    DEFAULT '',
  `modelo`           VARCHAR(100)    DEFAULT '',
  `ano`              INT             DEFAULT NULL,
  `localizacao`      VARCHAR(100)    DEFAULT '',
  `status`           VARCHAR(30)     DEFAULT 'ativa',
  `numeroSerie`      VARCHAR(100)    DEFAULT '',
  `valor`            DECIMAL(15,2)   DEFAULT NULL,
  `ehCritico`        TINYINT(1)      DEFAULT 0,
  `manualUrl`        TEXT,
  `horariosOperacao` LONGTEXT,
  `criadoEm`         VARCHAR(64)     DEFAULT '',
  `atualizadoEm`     VARCHAR(64)     DEFAULT '',
  PRIMARY KEY (`id`),
  KEY `idx_status` (`status`),
  KEY `idx_criticidade` (`criticidade`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------
-- tbli_responsaveis
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `tbli_responsaveis` (
  `id`            VARCHAR(64)   NOT NULL,
  `nome`          VARCHAR(255)  NOT NULL DEFAULT '',
  `funcao`        VARCHAR(100)  DEFAULT '',
  `telefone`      VARCHAR(30)   DEFAULT '',
  `status`        VARCHAR(30)   DEFAULT 'ativo',
  `especialidades` TEXT,
  `custoHora`     DECIMAL(10,2) DEFAULT NULL,
  `criadoEm`      VARCHAR(64)   DEFAULT '',
  `atualizadoEm`  VARCHAR(64)   DEFAULT '',
  PRIMARY KEY (`id`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------
-- tbli_pecas
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `tbli_pecas` (
  `id`               VARCHAR(64)    NOT NULL,
  `descricao`        VARCHAR(255)   NOT NULL DEFAULT '',
  `codigo`           VARCHAR(50)    DEFAULT '',
  `tipo`             VARCHAR(20)    DEFAULT 'peca',
  `maquinaAssociada` VARCHAR(64)    DEFAULT '',
  `categoria`        VARCHAR(50)    DEFAULT '',
  `criticidade`      VARCHAR(20)    DEFAULT 'consumo',
  `estoqueMinimo`    INT            DEFAULT 0,
  `estoqueAtual`     INT            DEFAULT 0,
  `unidade`          VARCHAR(20)    DEFAULT 'un',
  `fornecedor`       VARCHAR(100)   DEFAULT '',
  `custo`            DECIMAL(10,2)  DEFAULT NULL,
  `situacao`         VARCHAR(20)    DEFAULT 'Ativo',
  `ncm`              VARCHAR(20)    DEFAULT '',
  `criadoEm`         VARCHAR(64)    DEFAULT '',
  `atualizadoEm`     VARCHAR(64)    DEFAULT '',
  PRIMARY KEY (`id`),
  KEY `idx_criticidade` (`criticidade`),
  KEY `idx_situacao` (`situacao`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------
-- tbli_usuarios
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `tbli_usuarios` (
  `id`          VARCHAR(64)  NOT NULL,
  `nome`        VARCHAR(100) NOT NULL DEFAULT '',
  `papel`       VARCHAR(30)  DEFAULT 'solicitante',
  `pin`         VARCHAR(10)  DEFAULT '1234',
  `ativo`       TINYINT(1)   DEFAULT 1,
  `criadoEm`    VARCHAR(64)  DEFAULT '',
  `atualizadoEm` VARCHAR(64) DEFAULT '',
  PRIMARY KEY (`id`),
  KEY `idx_papel` (`papel`),
  KEY `idx_ativo` (`ativo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------
-- tbli_planos_preventivos
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `tbli_planos_preventivos` (
  `id`             VARCHAR(100)  NOT NULL,
  `nome`           VARCHAR(255)  NOT NULL DEFAULT '',
  `maquinas`       LONGTEXT,
  `frequencia`     VARCHAR(30)   DEFAULT 'Mensal',
  `tempoEstimado`  FLOAT         DEFAULT 1,
  `icon`           VARCHAR(50)   DEFAULT 'fa-list-check',
  `secoes`         LONGTEXT,
  `ativo`          TINYINT(1)    DEFAULT 1,
  `criadoEm`       VARCHAR(64)   DEFAULT '',
  `atualizadoEm`   VARCHAR(64)   DEFAULT '',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------
-- tbli_manutencoes
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `tbli_manutencoes` (
  `id`                VARCHAR(64)   NOT NULL,
  `numero`            VARCHAR(10)   DEFAULT '',
  `tipo`              VARCHAR(20)   DEFAULT 'preventiva',
  `prioridade`        VARCHAR(20)   DEFAULT 'media',
  `maquina`           VARCHAR(255)  DEFAULT '',
  `descricao`         TEXT,
  `pecas`             TEXT,
  `responsavel`       VARCHAR(255)  DEFAULT '',
  `dataPrevista`      VARCHAR(10)   DEFAULT '',
  `tempoEstimado`     FLOAT         DEFAULT NULL,
  `recorrencia`       VARCHAR(30)   DEFAULT 'nenhuma',
  `status`            VARCHAR(30)   DEFAULT 'pendente',
  `criadoEm`          VARCHAR(64)   DEFAULT '',
  `criadoPor`         VARCHAR(100)  DEFAULT '',
  `iniciadoEm`        VARCHAR(64)   DEFAULT NULL,
  `inicioObs`         TEXT,
  `concluidoEm`       VARCHAR(64)   DEFAULT NULL,
  `tempoReal`         INT           DEFAULT NULL,
  `oQueFoiFeto`       TEXT,
  `pecasUtilizadas`   TEXT,
  `proximaManutencao` VARCHAR(10)   DEFAULT NULL,
  `conclusaoObs`      TEXT,
  `observacoes`       TEXT,
  `checklist`         LONGTEXT,
  `canceladoEm`       VARCHAR(64)   DEFAULT NULL,
  `pausadoEm`         VARCHAR(64)   DEFAULT NULL,
  `historico`         LONGTEXT,
  `atualizadoEm`      VARCHAR(64)   DEFAULT '',
  PRIMARY KEY (`id`),
  KEY `idx_status`      (`status`),
  KEY `idx_tipo`        (`tipo`),
  KEY `idx_prioridade`  (`prioridade`),
  KEY `idx_dataPrevista`(`dataPrevista`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
