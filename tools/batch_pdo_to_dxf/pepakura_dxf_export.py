# SPDX-License-Identifier: MIT
"""
Automate Pepakura Designer 6: open each .pdo → export Pattern Single File → DXF.

Pepakura 6 English menus (from user screenshots):
  File → Export → Pattern: Single File (dxf, svg, eps, emf, png, jpg, bmp, tiff)...
  Save As → type DXF (*.dxf)

Also available: Ctrl+Shift+E = Pattern: Per Sheet (use if Single File fails).
"""

from __future__ import annotations

import subprocess
import time
from pathlib import Path

# Exact Pepakura Designer 6 menu labels
MENU_SINGLE_FILE = (
    "File->Export->Pattern: Single File (dxf, svg, eps, emf, png, jpg, bmp, tiff)..."
)
MENU_SINGLE_FILE_NO_ELLIPSIS = (
    "File->Export->Pattern: Single File (dxf, svg, eps, emf, png, jpg, bmp, tiff)"
)
MENU_PER_SHEET = (
    "File->Export->Pattern: Per Sheet (dxf, svg, pdf, png, jpg, bmp, tiff)..."
)


def _sleep(s: float) -> None:
    time.sleep(s)


def _focus_pepakura() -> None:
    try:
        import pygetwindow as gw

        for title in gw.getAllTitles():
            if not title:
                continue
            t = title.lower()
            if "pepakura designer" in t or (
                "pepakura" in t and "designer" in t
            ):
                wins = gw.getWindowsWithTitle(title)
                if wins:
                    win = wins[0]
                    if win.isMinimized:
                        win.restore()
                    win.activate()
                    _sleep(0.4)
                    return
    except Exception:
        pass


def _open_pdo(pepakura_exe: Path, pdo: Path, open_wait: float) -> None:
    subprocess.Popen([str(pepakura_exe), str(pdo)], shell=False)
    _sleep(open_wait)
    _focus_pepakura()


def _save_dialog_paste_dxf(dxf: Path, dialog_wait: float = 1.0) -> None:
    import pyautogui
    import pyperclip

    _sleep(dialog_wait)
    # Ensure DXF is selected in "Save as type" — Tab to combo, type dxf
    # Filename field is usually focused first; paste full path with .dxf
    pyperclip.copy(str(dxf))
    pyautogui.hotkey("ctrl", "a")
    _sleep(0.1)
    pyautogui.hotkey("ctrl", "v")
    _sleep(0.25)
    # Jump to type dropdown and force DXF
    pyautogui.hotkey("alt", "t")  # common Windows "Save as type" accelerator
    _sleep(0.2)
    pyautogui.typewrite("dxf")
    _sleep(0.2)
    pyautogui.press("enter")  # confirm type
    _sleep(0.25)
    pyautogui.press("enter")  # Save
    _sleep(0.35)
    # Overwrite Yes
    pyautogui.press("y")
    _sleep(0.8)


def _close_document() -> None:
    import pyautogui

    pyautogui.hotkey("ctrl", "w")
    _sleep(0.35)
    pyautogui.press("n")  # don't save PDO changes
    _sleep(0.4)


def try_pywinauto_export(
    pepakura_exe: Path,
    pdo: Path,
    dxf: Path,
    open_wait: float = 5.0,
) -> bool:
    try:
        from pywinauto import Application
    except ImportError:
        return False

    if dxf.exists():
        try:
            dxf.unlink()
        except OSError:
            pass
    dxf.parent.mkdir(parents=True, exist_ok=True)

    _open_pdo(pepakura_exe, pdo, open_wait)

    try:
        app = Application(backend="uia").connect(path=str(pepakura_exe), timeout=25)
    except Exception:
        try:
            app = Application(backend="uia").connect(
                title_re=".*Pepakura Designer.*", timeout=25
            )
        except Exception:
            return False

    try:
        win = app.top_window()
        win.set_focus()
        opened = False
        for path in (
            MENU_SINGLE_FILE,
            MENU_SINGLE_FILE_NO_ELLIPSIS,
            MENU_PER_SHEET,
            "File->Export->Pattern: Single File...",
        ):
            try:
                win.menu_select(path)
                opened = True
                break
            except Exception:
                continue
        if not opened:
            return False

        _save_dialog_paste_dxf(dxf)
        _close_document()
        return dxf.exists() and dxf.stat().st_size > 0
    except Exception:
        return False


def export_pdo_to_dxf_keyboard(
    pepakura_exe: Path,
    pdo: Path,
    dxf: Path,
    *,
    open_wait: float = 5.0,
    use_per_sheet_hotkey: bool = False,
) -> None:
    """
    Keyboard-driven Pepakura 6 export.

    Single File path:
      Alt+F → Down to Export → Right → Enter on Pattern: Single File
    Per Sheet shortcut (one DXF per page):
      Ctrl+Shift+E
    """
    import pyautogui

    pyautogui.FAILSAFE = True
    pyautogui.PAUSE = 0.12

    if dxf.exists():
        try:
            dxf.unlink()
        except OSError:
            pass
    dxf.parent.mkdir(parents=True, exist_ok=True)

    _open_pdo(pepakura_exe, pdo, open_wait)

    if use_per_sheet_hotkey:
        # Documented Pepakura 6 shortcut for Pattern: Per Sheet
        pyautogui.hotkey("ctrl", "shift", "e")
    else:
        # File menu → Export → Pattern: Single File (first submenu item)
        pyautogui.hotkey("alt", "f")
        _sleep(0.45)
        # File items: Open, Save, Save As, Reload, Import, Export  → 5 downs from Open
        for _ in range(5):
            pyautogui.press("down")
            _sleep(0.08)
        pyautogui.press("right")  # open Export submenu
        _sleep(0.35)
        # First item = Pattern: Single File
        pyautogui.press("enter")

    _save_dialog_paste_dxf(dxf)
    _close_document()


def export_pdo_to_dxf(
    pepakura_exe: Path,
    pdo: Path,
    dxf: Path,
    *,
    open_wait: float = 5.0,
    dialog_wait: float = 1.2,
    after_save_wait: float = 1.5,
    use_per_sheet_hotkey: bool = False,
) -> None:
    """Try UI Automation, then keyboard fallback matching Pepakura 6 menus."""
    if try_pywinauto_export(pepakura_exe, pdo, dxf, open_wait=open_wait):
        return
    export_pdo_to_dxf_keyboard(
        pepakura_exe,
        pdo,
        dxf,
        open_wait=open_wait,
        use_per_sheet_hotkey=use_per_sheet_hotkey,
    )
    _ = (dialog_wait, after_save_wait)  # kept for call compatibility
