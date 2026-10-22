; Agregado al instalador de electron-builder (package.json → build.nsis.include).
; Al desinstalar (no al instalar una versión nueva encima), .bpmn deja de apuntar a Fluye: electron-builder borra el
; tipo de archivo, pero deja la extensión apuntando a él y Windows la mostraría como un tipo que ya no existe.
!macro customUnInstall
  ${ifNot} ${isUpdated}
    ReadRegStr $0 SHELL_CONTEXT "Software\Classes\.bpmn" ""
    DeleteRegValue SHELL_CONTEXT "Software\Classes\.bpmn\OpenWithProgids" "Fluye.bpmn"
    DeleteRegKey /ifempty SHELL_CONTEXT "Software\Classes\.bpmn\OpenWithProgids"
    ${if} $0 == "Fluye.bpmn"
      DeleteRegValue SHELL_CONTEXT "Software\Classes\.bpmn" ""
    ${endIf}
    DeleteRegKey /ifempty SHELL_CONTEXT "Software\Classes\.bpmn"
  ${endIf}
!macroend
