;--------------------------------
;Includes
!addplugindir "."
!include "MUI2.nsh"
!include "FileFunc.nsh"
!include "StrFunc.nsh"
!include "nsProcess.nsh"
!include "WordFunc.nsh"
!insertmacro GetParameters
!insertmacro un.GetParameters
${StrStr}
${UnStrStr}

;--------------------------------
;General

;!define SRC "output\ie\*.*"
;!define PRODUCT_NAME "Kango"
!define URL "http://kangoextensions.com/"
!define UNINSTALL_REG_PATH "Software\Microsoft\Windows\CurrentVersion\Uninstall\${PRODUCT_NAME}"
!define REG_PATH "Software\${PRODUCT_NAME}"
;!define VERSION  "1.0.0"
!define DLL_NAME "Kango.dll"

;--------------------------------
;Updater defines

CRCCheck On

; Name and file
Name "${PRODUCT_NAME}"
OutFile "${OUT}"

; Default installation folder
InstallDir "$PROGRAMFILES\${PRODUCT_NAME}"

;Get installation folder from registry if available
InstallDirRegKey HKLM "${REG_PATH}" ""
  
; Request application privileges for Windows Vista
RequestExecutionLevel admin


;--------------------------------
;Interface Settings

!define MUI_ABORTWARNING
!define MUI_ICON "${NSISDIR}\Contrib\Graphics\Icons\orange-install.ico"
!define MUI_UNICON "${NSISDIR}\Contrib\Graphics\Icons\orange-uninstall.ico"


;--------------------------------
;Pages
!insertmacro MUI_PAGE_WELCOME
;!insertmacro MUI_PAGE_LICENSE "license.txt"
!insertmacro MUI_PAGE_DIRECTORY
;!insertmacro MUI_PAGE_COMPONENTS
!insertmacro MUI_PAGE_INSTFILES

; MUI_PAGE_FINISH settings
	!define MUI_FINISHPAGE_LINK ${URL}
	!define MUI_FINISHPAGE_LINK_LOCATION ${URL}
!insertmacro MUI_PAGE_FINISH

!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES

;--------------------------------
;Languages

!insertmacro MUI_LANGUAGE "English"

;--------------------------------
;Installer Sections

Function CheckCurrentVersion

	ReadRegStr $R0 HKLM "${UNINSTALL_REG_PATH}" "DisplayVersion"
	${VersionCompare} "${VERSION}" $R0 $R3
	StrCmp $R3 "0" versions_equal versions_not_equal
versions_equal:
	MessageBox MB_OK|MB_ICONEXCLAMATION "You already have latest version of ${PRODUCT_NAME} installed. Installation will be aborted."
	Abort
versions_not_equal:
FunctionEnd

Function UninstallPreviousVersion

	ReadRegStr $R0 HKLM "${UNINSTALL_REG_PATH}" "UninstallString"
	ReadRegStr $R1 HKLM "${UNINSTALL_REG_PATH}" "InstallLocation"
	StrCmp $R0 "" return
	ExecWait "$R0 /S /update _?=$R1"
	
return:
	
FunctionEnd

Function .onInit
	Call CheckCurrentVersion
FunctionEnd

Section "Main" SecMain

	Call UninstallPreviousVersion
	
	;Store installation folder
	WriteRegStr HKLM "${REG_PATH}" "" $INSTDIR
	
	StrCpy $INSTDIR "$INSTDIR\${VERSION}"
	SetOutPath "$INSTDIR"	

	File /r "${SRC}\*.*"
	
	; Write the uninstall keys for Windows
	WriteRegStr HKLM "${UNINSTALL_REG_PATH}" "UninstallString" '"$INSTDIR\uninstall.exe"'
	WriteRegStr HKLM "${UNINSTALL_REG_PATH}" "DisplayVersion" "${VERSION}" 
	WriteRegStr HKLM "${UNINSTALL_REG_PATH}" "InstallLocation" "$INSTDIR" 
	;WriteRegStr HKLM "${UNINSTALL_REG_PATH}" "DisplayIcon" '"$INSTDIR\${MAIN_MODULE_NAME}", 0'
	WriteRegStr HKLM "${UNINSTALL_REG_PATH}" "Publisher" "KangoExtensions"
	WriteRegStr HKLM "${UNINSTALL_REG_PATH}" "URLInfoAbout" ${URL}
	WriteRegDWORD HKLM "${UNINSTALL_REG_PATH}" "NoModify" 1
	WriteRegDWORD HKLM "${UNINSTALL_REG_PATH}" "NoRepair" 1
	WriteRegStr HKLM "${UNINSTALL_REG_PATH}" "DisplayName" "${PRODUCT_NAME}"

	; Create uninstaller
	WriteUninstaller "$INSTDIR\Uninstall.exe"
	
	RegDLL "$INSTDIR\${DLL_NAME}"
	
	DeleteRegKey HKCU "Software\Microsoft\Internet Explorer\ApprovedExtensionsMigration"

SectionEnd

;--------------------------------
;Uninstaller Section

Section "Uninstall"
	
	DeleteRegKey HKLM "${REG_PATH}"
	
	${un.GetParameters} $R0
	${UnStrStr} $R1 $R0 "/update"
	StrCmp $R1 "" clearStorage next
	clearStorage:
		ExecWait 'rundll32.exe "$INSTDIR\${DLL_NAME}",ClearStorage'	
	next:
	
	UnRegDLL "$INSTDIR\${DLL_NAME}"
	
	DeleteRegKey HKLM "${UNINSTALL_REG_PATH}"
	
	;Delete Files 
	RMDir /r /REBOOTOK "$INSTDIR\*" 

SectionEnd

Function .onInstSuccess
	${nsProcess::FindProcess} "iexplore.exe" $R0
	StrCmp $R0 0 0 +2
	MessageBox MB_OK|MB_ICONINFORMATION "Please restart Internet Explorer to finish installation."
FunctionEnd