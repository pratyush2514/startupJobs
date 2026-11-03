import { useEffect, useRef } from "react"
import { Close } from "./icons"
import { useBodyLock } from "../lib/hooks"
import type { Role } from "../lib/roles"
import { RoleDetail } from "./RoleDetail"

/** Modal shell for role details on the Jobs page (the map uses the panel). */
export function RoleDialog({
  role,
  onClose,
}: {
  role: Role
  onClose: () => void
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const closeRef = useRef(onClose)
  closeRef.current = onClose
  useBodyLock(true)

  useEffect(() => {
    const node = dialog.current
    if (!node) return
    if (!node.open) node.showModal()
    return () => {
      if (node.open) node.close()
    }
  }, [])

  return (
    <dialog
      ref={dialog}
      className="company-dialog"
      aria-labelledby="role-dialog-title"
      onCancel={(event) => {
        event.preventDefault()
        closeRef.current()
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) closeRef.current()
      }}
    >
      <div className="company-dialog-panel">
        <div className="company-dialog-head">
          <span />
          <button
            type="button"
            className="icon-button"
            onClick={onClose}
            aria-label="Close role details"
            autoFocus
          >
            <Close size={20} />
          </button>
        </div>
        <RoleDetail role={role} />
      </div>
    </dialog>
  )
}
