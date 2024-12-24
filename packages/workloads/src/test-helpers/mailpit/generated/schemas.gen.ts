/* eslint-disable max-lines */
// This file is auto-generated by @hey-api/openapi-ts

export const AddressSchema = {
    description: `An address such as "Barry Gibbs <bg@example.com>" is represented
as Address{Name: "Barry Gibbs", Address: "bg@example.com"}.`,
    type: 'object',
    title: 'Address represents a single mail address.',
    properties: {
        Address: {
            type: 'string'
        },
        Name: {
            type: 'string'
        }
    },
    'x-go-package': 'net/mail'
} as const;

export const AppInformationSchema = {
    description: 'AppInformation struct',
    type: 'object',
    properties: {
        Database: {
            description: 'Database path',
            type: 'string'
        },
        DatabaseSize: {
            description: 'Database size in bytes',
            type: 'number',
            format: 'double'
        },
        LatestVersion: {
            description: 'Latest Mailpit version',
            type: 'string'
        },
        Messages: {
            description: 'Total number of messages in the database',
            type: 'number',
            format: 'double'
        },
        RuntimeStats: {
            description: 'Runtime statistics',
            type: 'object',
            properties: {
                Memory: {
                    description: 'Current memory usage in bytes',
                    type: 'integer',
                    format: 'uint64'
                },
                MessagesDeleted: {
                    description: 'Database runtime messages deleted',
                    type: 'number',
                    format: 'double'
                },
                SMTPAccepted: {
                    description: 'Accepted runtime SMTP messages',
                    type: 'number',
                    format: 'double'
                },
                SMTPAcceptedSize: {
                    description: 'Total runtime accepted messages size in bytes',
                    type: 'number',
                    format: 'double'
                },
                SMTPIgnored: {
                    description: 'Ignored runtime SMTP messages (when using --ignore-duplicate-ids)',
                    type: 'number',
                    format: 'double'
                },
                SMTPRejected: {
                    description: 'Rejected runtime SMTP messages',
                    type: 'number',
                    format: 'double'
                },
                Uptime: {
                    description: 'Mailpit server uptime in seconds',
                    type: 'number',
                    format: 'double'
                }
            }
        },
        Tags: {
            description: 'Tags and message totals per tag',
            type: 'object',
            additionalProperties: {
                type: 'integer',
                format: 'int64'
            }
        },
        Unread: {
            description: 'Total number of messages in the database',
            type: 'number',
            format: 'double'
        },
        Version: {
            description: 'Current Mailpit version',
            type: 'string'
        }
    },
    'x-go-package': 'github.com/axllent/mailpit/internal/stats'
} as const;

export const AttachmentSchema = {
    description: 'Attachment struct for inline and attachments',
    type: 'object',
    properties: {
        ContentID: {
            description: 'Content ID',
            type: 'string'
        },
        ContentType: {
            description: 'Content type',
            type: 'string'
        },
        FileName: {
            description: 'File name',
            type: 'string'
        },
        PartID: {
            description: 'Attachment part ID',
            type: 'string'
        },
        Size: {
            description: 'Size in bytes',
            type: 'number',
            format: 'double'
        }
    },
    'x-go-package': 'github.com/axllent/mailpit/internal/storage'
} as const;

export const HTMLCheckResponseSchema = {
    description: 'Response represents the HTML check response struct',
    type: 'object',
    properties: {
        Platforms: {
            description: 'All platforms tested, mainly for the web UI',
            type: 'object',
            additionalProperties: {
                type: 'array',
                items: {
                    type: 'string'
                }
            }
        },
        Total: {
            '$ref': '#/definitions/HTMLCheckTotal'
        },
        Warnings: {
            description: 'List of warnings from tests',
            type: 'array',
            items: {
                '$ref': '#/definitions/HTMLCheckWarning'
            }
        }
    },
    'x-go-name': 'Response',
    'x-go-package': 'github.com/axllent/mailpit/internal/htmlcheck'
} as const;

export const HTMLCheckResultSchema = {
    description: 'Result struct',
    type: 'object',
    properties: {
        Family: {
            description: 'Family eg: Outlook, Mozilla Thunderbird',
            type: 'string'
        },
        Name: {
            description: 'Friendly name of result, combining family, platform & version',
            type: 'string'
        },
        NoteNumber: {
            description: 'Note number for partially supported if applicable',
            type: 'string'
        },
        Platform: {
            description: 'Platform eg: ios, android, windows',
            type: 'string'
        },
        Support: {
            description: 'Support [yes, no, partial]',
            type: 'string'
        },
        Version: {
            description: 'Family version eg: 4.7.1, 2019-10, 10.3',
            type: 'string'
        }
    },
    'x-go-name': 'Result',
    'x-go-package': 'github.com/axllent/mailpit/internal/htmlcheck'
} as const;

export const HTMLCheckScoreSchema = {
    description: 'Score struct',
    type: 'object',
    properties: {
        Found: {
            description: 'Number of matches in the document',
            type: 'integer',
            format: 'int64'
        },
        Partial: {
            description: 'Total percentage partially supported',
            type: 'number',
            format: 'float'
        },
        Supported: {
            description: 'Total percentage supported',
            type: 'number',
            format: 'float'
        },
        Unsupported: {
            description: 'Total percentage unsupported',
            type: 'number',
            format: 'float'
        }
    },
    'x-go-name': 'Score',
    'x-go-package': 'github.com/axllent/mailpit/internal/htmlcheck'
} as const;

export const HTMLCheckTotalSchema = {
    description: 'Total weighted result for all scores',
    type: 'object',
    properties: {
        Nodes: {
            description: 'Total number of HTML nodes detected in message',
            type: 'integer',
            format: 'int64'
        },
        Partial: {
            description: 'Overall percentage partially supported',
            type: 'number',
            format: 'float'
        },
        Supported: {
            description: 'Overall percentage supported',
            type: 'number',
            format: 'float'
        },
        Tests: {
            description: 'Total number of tests done',
            type: 'integer',
            format: 'int64'
        },
        Unsupported: {
            description: 'Overall percentage unsupported',
            type: 'number',
            format: 'float'
        }
    },
    'x-go-name': 'Total',
    'x-go-package': 'github.com/axllent/mailpit/internal/htmlcheck'
} as const;

export const HTMLCheckWarningSchema = {
    description: 'Warning represents a failed test',
    type: 'object',
    properties: {
        Category: {
            description: 'Category [css, html]',
            type: 'string'
        },
        Description: {
            description: 'Description',
            type: 'string'
        },
        Keywords: {
            description: 'Keywords',
            type: 'string'
        },
        NotesByNumber: {
            description: 'Notes based on results',
            type: 'object',
            additionalProperties: {
                type: 'string'
            }
        },
        Results: {
            description: 'Test results',
            type: 'array',
            items: {
                '$ref': '#/definitions/HTMLCheckResult'
            }
        },
        Score: {
            '$ref': '#/definitions/HTMLCheckScore'
        },
        Slug: {
            description: 'Slug identifier',
            type: 'string'
        },
        Tags: {
            description: 'Tags',
            type: 'array',
            items: {
                type: 'string'
            }
        },
        Title: {
            description: 'Friendly title',
            type: 'string'
        },
        URL: {
            description: 'URL to caniemail.com',
            type: 'string'
        }
    },
    'x-go-name': 'Warning',
    'x-go-package': 'github.com/axllent/mailpit/internal/htmlcheck'
} as const;

export const JSONErrorMessageSchema = {
    description: 'JSONErrorMessage struct',
    type: 'object',
    properties: {
        Error: {
            description: 'Error message',
            type: 'string',
            example: 'invalid format'
        }
    },
    'x-go-package': 'github.com/axllent/mailpit/server/apiv1'
} as const;

export const LinkSchema = {
    description: 'Link struct',
    type: 'object',
    properties: {
        Status: {
            description: 'HTTP status definition',
            type: 'string'
        },
        StatusCode: {
            description: 'HTTP status code',
            type: 'integer',
            format: 'int64'
        },
        URL: {
            description: 'Link URL',
            type: 'string'
        }
    },
    'x-go-package': 'github.com/axllent/mailpit/internal/linkcheck'
} as const;

export const LinkCheckResponseSchema = {
    description: 'Response represents the Link check response',
    type: 'object',
    properties: {
        Errors: {
            description: 'Total number of errors',
            type: 'integer',
            format: 'int64'
        },
        Links: {
            description: 'Tested links',
            type: 'array',
            items: {
                '$ref': '#/definitions/Link'
            }
        }
    },
    'x-go-name': 'Response',
    'x-go-package': 'github.com/axllent/mailpit/internal/linkcheck'
} as const;

export const MessageSchema = {
    description: 'Message data excluding physical attachments',
    type: 'object',
    properties: {
        Attachments: {
            description: 'Message attachments',
            type: 'array',
            items: {
                '$ref': '#/definitions/Attachment'
            }
        },
        Bcc: {
            description: 'Bcc addresses',
            type: 'array',
            items: {
                '$ref': '#/definitions/Address'
            }
        },
        Cc: {
            description: 'Cc addresses',
            type: 'array',
            items: {
                '$ref': '#/definitions/Address'
            }
        },
        Date: {
            description: 'Message date if set, else date received',
            type: 'string',
            format: 'date-time'
        },
        From: {
            '$ref': '#/definitions/Address'
        },
        HTML: {
            description: 'Message body HTML',
            type: 'string'
        },
        ID: {
            description: 'Database ID',
            type: 'string'
        },
        Inline: {
            description: 'Inline message attachments',
            type: 'array',
            items: {
                '$ref': '#/definitions/Attachment'
            }
        },
        MessageID: {
            description: 'Message ID',
            type: 'string'
        },
        ReplyTo: {
            description: 'ReplyTo addresses',
            type: 'array',
            items: {
                '$ref': '#/definitions/Address'
            }
        },
        ReturnPath: {
            description: 'Return-Path',
            type: 'string'
        },
        Size: {
            description: 'Message size in bytes',
            type: 'number',
            format: 'double'
        },
        Subject: {
            description: 'Message subject',
            type: 'string'
        },
        Tags: {
            description: 'Message tags',
            type: 'array',
            items: {
                type: 'string'
            }
        },
        Text: {
            description: 'Message body text',
            type: 'string'
        },
        To: {
            description: 'To addresses',
            type: 'array',
            items: {
                '$ref': '#/definitions/Address'
            }
        }
    },
    'x-go-package': 'github.com/axllent/mailpit/internal/storage'
} as const;

export const MessageHeadersResponseSchema = {
    description: 'Message headers',
    type: 'object',
    additionalProperties: {
        type: 'array',
        items: {
            type: 'string'
        }
    },
    'x-go-name': 'messageHeaders',
    'x-go-package': 'github.com/axllent/mailpit/server/apiv1'
} as const;

export const MessageSummarySchema = {
    description: 'MessageSummary struct for frontend messages',
    type: 'object',
    properties: {
        Attachments: {
            description: 'Whether the message has any attachments',
            type: 'integer',
            format: 'int64'
        },
        Bcc: {
            description: 'Bcc addresses',
            type: 'array',
            items: {
                '$ref': '#/definitions/Address'
            }
        },
        Cc: {
            description: 'Cc addresses',
            type: 'array',
            items: {
                '$ref': '#/definitions/Address'
            }
        },
        Created: {
            description: 'Created time',
            type: 'string',
            format: 'date-time'
        },
        From: {
            '$ref': '#/definitions/Address'
        },
        ID: {
            description: 'Database ID',
            type: 'string'
        },
        MessageID: {
            description: 'Message ID',
            type: 'string'
        },
        Read: {
            description: 'Read status',
            type: 'boolean'
        },
        ReplyTo: {
            description: 'Reply-To address',
            type: 'array',
            items: {
                '$ref': '#/definitions/Address'
            }
        },
        Size: {
            description: 'Message size in bytes (total)',
            type: 'number',
            format: 'double'
        },
        Snippet: {
            description: 'Message snippet includes up to 250 characters',
            type: 'string'
        },
        Subject: {
            description: 'Email subject',
            type: 'string'
        },
        Tags: {
            description: 'Message tags',
            type: 'array',
            items: {
                type: 'string'
            }
        },
        To: {
            description: 'To address',
            type: 'array',
            items: {
                '$ref': '#/definitions/Address'
            }
        }
    },
    'x-go-package': 'github.com/axllent/mailpit/internal/storage'
} as const;

export const MessagesSummarySchema = {
    description: 'MessagesSummary is a summary of a list of messages',
    type: 'object',
    properties: {
        messages: {
            description: `Messages summary
in: body`,
            type: 'array',
            items: {
                '$ref': '#/definitions/MessageSummary'
            },
            'x-go-name': 'Messages'
        },
        messages_count: {
            description: 'Total number of messages matching current query',
            type: 'number',
            format: 'double',
            'x-go-name': 'MessagesCount'
        },
        start: {
            description: 'Pagination offset',
            type: 'integer',
            format: 'int64',
            'x-go-name': 'Start'
        },
        tags: {
            description: 'All current tags',
            type: 'array',
            items: {
                type: 'string'
            },
            'x-go-name': 'Tags'
        },
        total: {
            description: 'Total number of messages in mailbox',
            type: 'number',
            format: 'double',
            'x-go-name': 'Total'
        },
        unread: {
            description: 'Total number of unread messages in mailbox',
            type: 'number',
            format: 'double',
            'x-go-name': 'Unread'
        }
    },
    'x-go-package': 'github.com/axllent/mailpit/server/apiv1'
} as const;

export const RuleSchema = {
    description: 'Rule struct',
    type: 'object',
    properties: {
        Description: {
            description: 'SpamAssassin rule description',
            type: 'string'
        },
        Name: {
            description: 'SpamAssassin rule name',
            type: 'string'
        },
        Score: {
            description: 'Spam rule score',
            type: 'number',
            format: 'double'
        }
    },
    'x-go-package': 'github.com/axllent/mailpit/internal/spamassassin'
} as const;

export const SendMessageConfirmationSchema = {
    description: 'SendMessageConfirmation struct',
    type: 'object',
    properties: {
        ID: {
            description: 'Database ID',
            type: 'string',
            example: 'iAfZVVe2UQfNSG5BAjgYwa'
        }
    },
    'x-go-package': 'github.com/axllent/mailpit/server/apiv1'
} as const;

export const SendRequestSchema = {
    description: 'SendRequest to send a message via HTTP',
    type: 'object',
    required: ['From'],
    properties: {
        Attachments: {
            description: 'Attachments',
            type: 'array',
            items: {
                type: 'object',
                required: ['Content', 'Filename'],
                properties: {
                    Content: {
                        description: 'Base64-encoded string of the file content',
                        type: 'string',
                        example: 'VGhpcyBpcyBhIHBsYWluIHRleHQgYXR0YWNobWVudA=='
                    },
                    Filename: {
                        description: 'Filename',
                        type: 'string',
                        example: 'AttachedFile.txt'
                    }
                }
            }
        },
        Bcc: {
            description: 'Bcc recipients email addresses only',
            type: 'array',
            items: {
                type: 'string'
            },
            example: ['jack@example.com']
        },
        Cc: {
            description: 'Cc recipients',
            type: 'array',
            items: {
                type: 'object',
                required: ['Email'],
                properties: {
                    Email: {
                        description: 'Email address',
                        type: 'string',
                        example: 'manager@example.com'
                    },
                    Name: {
                        description: 'Optional name',
                        type: 'string',
                        example: 'Manager'
                    }
                }
            }
        },
        From: {
            description: '"From" recipient',
            type: 'object',
            required: ['Email'],
            properties: {
                Email: {
                    description: 'Email address',
                    type: 'string',
                    example: 'john@example.com'
                },
                Name: {
                    description: 'Optional name',
                    type: 'string',
                    example: 'John Doe'
                }
            }
        },
        HTML: {
            description: 'Message body (HTML)',
            type: 'string',
            example: '<p style="font-family: arial">Mailpit is <b>awesome</b>!</p>'
        },
        Headers: {
            description: 'Optional headers in {"key":"value"} format',
            type: 'object',
            additionalProperties: {
                type: 'string'
            },
            example: {
                'X-IP': '1.2.3.4'
            }
        },
        ReplyTo: {
            description: 'Optional Reply-To recipients',
            type: 'array',
            items: {
                type: 'object',
                required: ['Email'],
                properties: {
                    Email: {
                        description: 'Email address',
                        type: 'string',
                        example: 'secretary@example.com'
                    },
                    Name: {
                        description: 'Optional name',
                        type: 'string',
                        example: 'Secretary'
                    }
                }
            }
        },
        Subject: {
            description: 'Subject',
            type: 'string',
            example: 'Mailpit message via the HTTP API'
        },
        Tags: {
            description: 'Mailpit tags',
            type: 'array',
            items: {
                type: 'string'
            },
            example: ['Tag 1', 'Tag 2']
        },
        Text: {
            description: 'Message body (text)',
            type: 'string',
            example: 'This is the text body'
        },
        To: {
            description: '"To" recipients',
            type: 'array',
            items: {
                type: 'object',
                required: ['Email'],
                properties: {
                    Email: {
                        description: 'Email address',
                        type: 'string',
                        example: 'jane@example.com'
                    },
                    Name: {
                        description: 'Optional name',
                        type: 'string',
                        example: 'Jane Doe'
                    }
                }
            }
        }
    },
    'x-go-package': 'github.com/axllent/mailpit/server/apiv1'
} as const;

export const SpamAssassinResponseSchema = {
    description: 'Result is a SpamAssassin result',
    type: 'object',
    properties: {
        Error: {
            description: 'If populated will return an error string',
            type: 'string'
        },
        IsSpam: {
            description: 'Whether the message is spam or not',
            type: 'boolean'
        },
        Rules: {
            description: 'Spam rules triggered',
            type: 'array',
            items: {
                '$ref': '#/definitions/Rule'
            }
        },
        Score: {
            description: 'Total spam score based on triggered rules',
            type: 'number',
            format: 'double'
        }
    },
    'x-go-name': 'Result',
    'x-go-package': 'github.com/axllent/mailpit/internal/spamassassin'
} as const;

export const WebUIConfigurationSchema = {
    description: 'Response includes global web UI settings',
    type: 'object',
    properties: {
        DuplicatesIgnored: {
            description: 'Whether messages with duplicate IDs are ignored',
            type: 'boolean'
        },
        Label: {
            description: 'Optional label to identify this Mailpit instance',
            type: 'string'
        },
        MessageRelay: {
            description: 'Message Relay information',
            type: 'object',
            properties: {
                AllowedRecipients: {
                    description: 'Only allow relaying to these recipients (regex)',
                    type: 'string'
                },
                BlockedRecipients: {
                    description: 'Block relaying to these recipients (regex)',
                    type: 'string'
                },
                Enabled: {
                    description: 'Whether message relaying (release) is enabled',
                    type: 'boolean'
                },
                ReturnPath: {
                    description: 'Enforced Return-Path (if set) for relay bounces',
                    type: 'string'
                },
                SMTPServer: {
                    description: 'The configured SMTP server address',
                    type: 'string'
                }
            }
        },
        SpamAssassin: {
            description: 'Whether SpamAssassin is enabled',
            type: 'boolean'
        }
    },
    'x-go-name': 'webUIConfiguration',
    'x-go-package': 'github.com/axllent/mailpit/server/apiv1'
} as const;