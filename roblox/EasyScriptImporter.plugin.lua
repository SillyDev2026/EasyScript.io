-- EasyScript.io Studio Importer (v1.3) · Install as a Roblox Studio plugin Script.
-- Paste EasyScript's "Export source manifest" JSON. No HTTP, tokens or cloud account.
-- Imports are created with BaseScript.Enabled=false until reviewed.
local HttpService = game:GetService("HttpService")
local ServerScriptService = game:GetService("ServerScriptService")
local StarterPlayer = game:GetService("StarterPlayer")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local toolbar = plugin:CreateToolbar("EasyScript")
local toggle = toolbar:CreateButton("Import", "Open EasyScript source importer", "rbxassetid://0")
toggle.ClickableWhenViewportHidden = true
local info = DockWidgetPluginGuiInfo.new(Enum.InitialDockState.Float, true, false, 600, 550, 320, 260)
local widget = plugin:CreateDockWidgetPluginGui("EasyScriptSourceImporterV13", info)
widget.Title = "EasyScript · Import Sources"
toggle.Click:Connect(function() widget.Enabled = not widget.Enabled end)

local layout = Instance.new("UIListLayout")
layout.SortOrder = Enum.SortOrder.LayoutOrder
layout.Padding = UDim.new(0, 8)
layout.Parent = widget
local padding = Instance.new("UIPadding")
padding.PaddingLeft = UDim.new(0, 12)
padding.PaddingRight = UDim.new(0, 12)
padding.PaddingTop = UDim.new(0, 12)
padding.Parent = widget

local help = Instance.new("TextLabel")
help.LayoutOrder = 1
help.Size = UDim2.new(1, 0, 0, 70)
help.BackgroundTransparency = 1
help.TextWrapped = true
help.TextXAlignment = Enum.TextXAlignment.Left
help.TextYAlignment = Enum.TextYAlignment.Top
help.Text = "Paste source manifest JSON from EasyScript → Manage files → Export source manifest. Preview first, then import disabled. Review every script before enabling."
help.Parent = widget

local input = Instance.new("TextBox")
input.LayoutOrder = 2
input.Size = UDim2.new(1, 0, 0, 245)
input.MultiLine = true
input.ClearTextOnFocus = false
input.TextEditable = true
input.TextWrapped = false
input.TextXAlignment = Enum.TextXAlignment.Left
input.TextYAlignment = Enum.TextYAlignment.Top
input.PlaceholderText = '{"format":"EasyScript-source-manifest-v1","files":[]}'
input.Text = ""
input.Parent = widget

local status = Instance.new("TextLabel")
status.LayoutOrder = 3
status.Size = UDim2.new(1, 0, 0, 70)
status.BackgroundTransparency = 1
status.TextWrapped = true
status.TextXAlignment = Enum.TextXAlignment.Left
status.TextYAlignment = Enum.TextYAlignment.Top
status.Text = "Ready. Nothing will be installed until you confirm."
status.Parent = widget

local buttons = Instance.new("Frame")
buttons.LayoutOrder = 4
buttons.Size = UDim2.new(1, 0, 0, 38)
buttons.BackgroundTransparency = 1
buttons.Parent = widget
local row = Instance.new("UIListLayout")
row.FillDirection = Enum.FillDirection.Horizontal
row.Padding = UDim.new(0, 8)
row.Parent = buttons
local function button(text)
    local b = Instance.new("TextButton")
    b.Size = UDim2.new(0.5, -4, 1, 0)
    b.Text = text
    b.Parent = buttons
    return b
end
local previewButton = button("Preview")
local importButton = button("Import disabled scripts")
importButton.Active = false
importButton.AutoButtonColor = false

local pending = nil
local function validName(name)
    return type(name) == "string" and #name > 0 and #name <= 72 and
        name:match("^[%w_%-%.]+$") ~= nil and
        not name:find("%.%.", 1, true)
end
local function check(jsonText)
    if #jsonText > 6000000 then error("Manifest is too large") end
    local data = HttpService:JSONDecode(jsonText)
    if type(data) ~= "table" or data.format ~= "EasyScript-source-manifest-v1" then
        error("Use EasyScript's source-manifest JSON, not a workspace JSON or ZIP file")
    end
    if type(data.files) ~= "table" or #data.files < 1 or #data.files > 24 then
        error("Expected between 1 and 24 files")
    end
    for _, file in ipairs(data.files) do
        if type(file) ~= "table" or not validName(file.name) or
            type(file.source) ~= "string" or #file.source > 200000 then
            error("Invalid file name or source size")
        end
        if file.type ~= "Script" and file.type ~= "LocalScript" and file.type ~= "ModuleScript" then
            error("Studio importer supports Luau Scripts, LocalScripts and ModuleScripts only")
        end
        if file.language ~= "luau" then error("JavaScript files cannot be imported into Roblox Studio") end
    end
    return data
end
previewButton.MouseButton1Click:Connect(function()
    pending = nil
    importButton.Active = false
    importButton.AutoButtonColor = false
    local ok, result = pcall(check, input.Text)
    if not ok then status.Text = "Validation failed: " .. tostring(result); return end
    pending = result
    local summary = {}
    for _, file in ipairs(result.files) do
        table.insert(summary, file.type .. ": " .. file.name)
    end
    status.Text = "Validated " .. #result.files .. " files. Review their types before installing:\n" ..
        table.concat(summary, ", ")
    importButton.Active = true
    importButton.AutoButtonColor = true
end)

local function uniqueChild(parent, name)
    local result = name
    local number = 2
    while parent:FindFirstChild(result) do
        result = name .. "_" .. number
        number += 1
    end
    return result
end
importButton.MouseButton1Click:Connect(function()
    if not pending then status.Text = "Preview a valid manifest first"; return end
    local safe, errorMessage = pcall(function()
        local folderSSS = Instance.new("Folder")
        folderSSS.Name = uniqueChild(ServerScriptService, "EasyScriptImport")
        folderSSS.Parent = ServerScriptService
        local folderReplicated = Instance.new("Folder")
        folderReplicated.Name = uniqueChild(ReplicatedStorage, "EasyScriptModules")
        folderReplicated.Parent = ReplicatedStorage
        local folderClient = Instance.new("Folder")
        folderClient.Name = uniqueChild(StarterPlayer.StarterPlayerScripts, "EasyScriptClient")
        folderClient.Parent = StarterPlayer.StarterPlayerScripts
        for _, file in ipairs(pending.files) do
            local container
            if file.type == "Script" then container = folderSSS
            elseif file.type == "LocalScript" then container = folderClient
            else container = folderReplicated end
            local scriptObject = Instance.new(file.type)
            scriptObject.Name = uniqueChild(container, file.name:gsub("%.[^%.]+$", ""))
            if file.type ~= "ModuleScript" then
                scriptObject.Enabled = false
            end
            scriptObject.Source = file.source
            scriptObject.Parent = container
        end
    end)
    if safe then
        status.Text = "Imported " .. #pending.files .. " scripts. Script/LocalScript execution is disabled. Check sources and folder placement manually."
        pending = nil
        importButton.Active = false
        importButton.AutoButtonColor = false
    else
        status.Text = "Import error: " .. tostring(errorMessage)
    end
end)
