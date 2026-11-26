{{--
    Shared frame of the PDFs (dompdf): A4, light, made for printing.
    Lime is only ever a fill (with near-black text on it), never text on white.
    dompdf has no flexbox or grid: the layout uses tables.
--}}
<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<title>{{ $title }}</title>
<style>
    @font-face {
        font-family: 'Plus Jakarta Sans';
        font-weight: normal;
        font-style: normal;
        src: url('{{ resource_path('fonts/plus-jakarta-sans/PlusJakartaSans-Regular.ttf') }}') format('truetype');
    }
    @font-face {
        font-family: 'Plus Jakarta Sans';
        font-weight: 600;
        font-style: normal;
        src: url('{{ resource_path('fonts/plus-jakarta-sans/PlusJakartaSans-SemiBold.ttf') }}') format('truetype');
    }
    @font-face {
        font-family: 'Plus Jakarta Sans';
        font-weight: bold;
        font-style: normal;
        src: url('{{ resource_path('fonts/plus-jakarta-sans/PlusJakartaSans-Bold.ttf') }}') format('truetype');
    }

    @page { margin: 30px 44px 66px 44px; }

    * { box-sizing: border-box; }

    body {
        font-family: 'Plus Jakarta Sans', 'DejaVu Sans', sans-serif;
        font-size: 9.5pt;
        line-height: 1.4;
        color: #0B0A10;
        margin: 0;
    }

    table { width: 100%; border-collapse: collapse; }
    td, th { vertical-align: top; padding: 0; }
    p { margin: 0; }

    .muted { color: #5B5866; }
    .small { font-size: 8pt; }
    .semibold { font-weight: 600; }
    .bold { font-weight: bold; }
    .right { text-align: right; }
    .nowrap { white-space: nowrap; }

    /* Header: wordmark on the left, document title on the right */
    .band { height: 6px; background: #CDE86B; margin: 0 0 18px 0; }
    .wordmark { font-size: 22pt; font-weight: bold; letter-spacing: -0.5pt; line-height: 1; }
    .wordmark .dot { color: #4D5A12; }
    .doc-title { font-size: 17pt; font-weight: bold; line-height: 1.1; letter-spacing: -0.2pt; }
    .doc-meta { margin-top: 4px; }

    /* The one bold element: a lime block with the key figure */
    .key {
        background: #CDE86B;
        color: #0B0A10;
        padding: 10px 14px;
        border-radius: 10px;
    }
    .key-label { font-size: 8pt; font-weight: 600; }
    .key-value { font-size: 15pt; font-weight: bold; letter-spacing: -0.2pt; line-height: 1.2; }

    .section { margin-top: 14px; }
    .section-title { font-size: 10pt; font-weight: bold; margin-bottom: 6px; }

    .box { border: 1px solid #E4E2EA; border-radius: 10px; padding: 9px 12px; }
    .label { font-size: 8pt; color: #5B5866; margin-bottom: 2px; }

    /* Price lines */
    .lines th {
        font-size: 8pt;
        font-weight: 600;
        color: #5B5866;
        text-align: left;
        padding: 0 0 6px 0;
        border-bottom: 1px solid #0B0A10;
    }
    .lines th.right { text-align: right; }
    .lines td { padding: 6px 0; border-bottom: 1px solid #E4E2EA; }
    .lines .amount { text-align: right; white-space: nowrap; width: 110px; }

    .totals td { padding: 4px 0; }
    .totals .amount { text-align: right; white-space: nowrap; width: 110px; }
    .totals .grand td { border-top: 1px solid #0B0A10; padding-top: 8px; font-size: 11pt; font-weight: bold; }

    ul.checklist { margin: 0; padding: 0 0 0 14px; }
    ul.checklist li { margin: 0 0 2px 0; }
    .notes { font-size: 8.5pt; }

    /* Footer on every page */
    .footer {
        position: fixed;
        left: 0;
        right: 0;
        bottom: -48px;
        font-size: 7.5pt;
        color: #5B5866;
        border-top: 1px solid #E4E2EA;
        padding-top: 8px;
        text-align: center;
    }
</style>
</head>
<body>
<div class="footer">
    {{ $company['name'] }}, {{ $company['address'] }}, {{ $company['city'] }}<br>
    ICE {{ $company['ice'] }} &nbsp;|&nbsp; RC {{ $company['rc'] }} &nbsp;|&nbsp; IF {{ $company['if'] }} &nbsp;|&nbsp; {{ $company['phone'] }} &nbsp;|&nbsp; {{ $company['email'] }}
</div>

<div class="band"></div>

@yield('content')
</body>
</html>
