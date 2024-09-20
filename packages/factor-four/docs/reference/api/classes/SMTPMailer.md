[@monolayer/factor-four](../globals.md) / SMTPMailer

# Class: SMTPMailer

SMTP Mailer.

## Properties

| Property | Modifier | Type |
| ------ | ------ | ------ |
| `container` | `public` | [`SMTPContainer`](SMTPContainer.md) |
| `id` | `public` | `string` |

## Accessors

### credentialsEnvVar

> `get` **credentialsEnvVar**(): `string`

Returns the environment variable name that should contain the STMP connection URL.

#### Returns

`string`

***

### transporter

> `get` **transporter**(): `Transporter`

#### Returns

`Transporter`

## Constructors

### new SMTPMailer()

> **new SMTPMailer**(`id`): [`SMTPMailer`](SMTPMailer.md)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `id` | `string` |

#### Returns

[`SMTPMailer`](SMTPMailer.md)
