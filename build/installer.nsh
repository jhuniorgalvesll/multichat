; Pasos extra del instalador de MultiChat Pro (electron-builder los incluye en el instalador NSIS).
; Objetivo: que después de instalar solo quede la versión nueva y Windows no siga abriendo una copia vieja.

!macro customInit
  ; Cierra MultiChat si quedó abierto (por ejemplo minimizado en la bandeja), para poder reemplazar sus archivos.
  nsExec::Exec 'taskkill /F /IM "MultiChat.exe" /T'
  Sleep 800
!macroend

; Borra una instalación vieja solo si es una carpeta de MultiChat (tiene MultiChat.exe) y no es la carpeta actual.
!macro removeOldCopy DIR
  ${If} "${DIR}" != "$INSTDIR"
  ${AndIf} ${FileExists} "${DIR}\MultiChat.exe"
    RMDir /r "${DIR}"
  ${EndIf}
!macroend

!macro customInstall
  ; Copias viejas en las carpetas donde pudo instalarse antes
  !insertmacro removeOldCopy "$PROFILE\MultiChat"
  !insertmacro removeOldCopy "$LOCALAPPDATA\Programs\multichat"
  !insertmacro removeOldCopy "$LOCALAPPDATA\Programs\MultiChat"
  !insertmacro removeOldCopy "$PROGRAMFILES64\MultiChat"
  !insertmacro removeOldCopy "$PROGRAMFILES\MultiChat"

  ; Accesos directos viejos. Esta parte corre después de crear los accesos nuevos: el del escritorio
  ; "para todos los usuarios" solo se borra si esta instalación es solo para el usuario actual.
  SetShellVarContext all
  ${If} $installMode != "all"
    Delete "$DESKTOP\MultiChat.lnk"
  ${EndIf}
  Delete "$SMSTARTUP\MultiChat.lnk"
  SetShellVarContext current
  Delete "$SMSTARTUP\MultiChat.lnk"
  ; Deja el contexto como lo tenía el instalador
  ${If} $installMode == "all"
    SetShellVarContext all
  ${EndIf}

  ; Inicio automático viejo: la app lo vuelve a crear apuntando a esta instalación si está activado.
  DeleteRegValue HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "com.multichat.app"
  DeleteRegValue HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "MultiChat"
  DeleteRegValue HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "electron.app.MultiChat"
!macroend
