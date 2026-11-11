$ErrorActionPreference = 'Stop'
$siteRoot = Split-Path -Parent $PSScriptRoot
$shelfRoot = [IO.Path]::GetFullPath((Join-Path $siteRoot '../../../../dj/ShelfData-Belarus'))
. (Join-Path $shelfRoot 'scripts/hf_token_storage.ps1')
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
[System.Windows.Forms.Application]::EnableVisualStyles()
$dialog = New-Object System.Windows.Forms.Form
$dialog.Text = 'Vercel: site_shop_work-dk21 (Production)'
$dialog.ClientSize = New-Object System.Drawing.Size(640,260)
$dialog.StartPosition = 'CenterScreen'
$dialog.FormBorderStyle = 'FixedDialog'
$dialog.MaximizeBox = $false
$note = New-Object System.Windows.Forms.Label
$note.Text = "Значения не отображаются и не записываются в файл.`r`nВставляйте только в Sensitive-переменные Production проекта site_shop_work-dk21."
$note.Location = New-Object System.Drawing.Point(18,18)
$note.Size = New-Object System.Drawing.Size(600,55)
$dialog.Controls.Add($note)
$status = New-Object System.Windows.Forms.Label
$status.Text = 'Сначала создайте нужное имя переменной в Vercel.'
$status.Location = New-Object System.Drawing.Point(18,200)
$status.Size = New-Object System.Drawing.Size(600,45)
$dialog.Controls.Add($status)
$script:lastCopied = $null
$tokenButton = New-Object System.Windows.Forms.Button
$tokenButton.Text = 'Скопировать SHELFDATA_HF_TOKEN'
$tokenButton.Location = New-Object System.Drawing.Point(18,85)
$tokenButton.Size = New-Object System.Drawing.Size(600,40)
$dialog.Controls.Add($tokenButton)
$hashButton = New-Object System.Windows.Forms.Button
$hashButton.Text = 'Скопировать RECOGNITION_PASSWORD_HASH'
$hashButton.Location = New-Object System.Drawing.Point(18,140)
$hashButton.Size = New-Object System.Drawing.Size(600,40)
$dialog.Controls.Add($hashButton)
$tokenButton.Add_Click({
    $secure=$null; $pointer=[IntPtr]::Zero
    try {
        $secure=Read-ShelfDataHfToken
        $pointer=[Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
        $script:lastCopied=[Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer)
        [System.Windows.Forms.Clipboard]::SetText($script:lastCopied)
        $status.Text='Токен скопирован. Вставьте в SHELFDATA_HF_TOKEN и сохраните.'
    }
    catch { $status.Text='Не удалось прочитать защищённый токен. Значение не выводилось.' }
    finally {
        if($pointer -ne [IntPtr]::Zero){[Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer)}
        if($secure){$secure.Dispose()}
    }
})
$hashButton.Add_Click({
    try {
        $line=[IO.File]::ReadAllLines((Join-Path $siteRoot '.env.local')) | Where-Object {$_ -match '^RECOGNITION_PASSWORD_HASH=scrypt1:[a-f0-9]{32}:[a-f0-9]{64}$'}
        if(@($line).Count -ne 1){throw 'Invalid private verifier configuration'}
        $script:lastCopied=$line.Substring('RECOGNITION_PASSWORD_HASH='.Length)
        [System.Windows.Forms.Clipboard]::SetText($script:lastCopied)
        $line=$null
        $status.Text='Хеш скопирован. Вставьте в RECOGNITION_PASSWORD_HASH и сохраните.'
    }
    catch {$status.Text='Не удалось прочитать приватный хеш. Значение не выводилось.'}
})
$dialog.Add_FormClosed({
    try {if($script:lastCopied -and [System.Windows.Forms.Clipboard]::ContainsText() -and [System.Windows.Forms.Clipboard]::GetText() -ceq $script:lastCopied){[System.Windows.Forms.Clipboard]::Clear()}}catch{}
    $script:lastCopied=$null
})
try {$dialog.ShowDialog() | Out-Null}finally{$dialog.Dispose()}
