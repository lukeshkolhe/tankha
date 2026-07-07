import { useState } from 'react';
import { Anchor, Button, FileInput, Group, Modal, Stack, Text } from '@mantine/core';
import { usePreviewImport } from '../api/usePreviewImport';
import { useCommitImport } from '../api/useCommitImport';
import { useSampleSheet } from '../api/useSampleSheet';
import { ImportPreviewPanel } from './ImportPreviewPanel';
import { ImportResultPanel } from './ImportResultPanel';

export interface ImportDialogProps {
  opened: boolean;
  onClose: () => void;
}

/**
 * Fully self-contained, controlled modal: the caller (the employee list page)
 * owns `opened`/`onClose` and renders its own "Import" trigger button — this
 * component only ever renders the dialog's contents.
 *
 * Flow: pick file -> preview auto-runs -> three buckets shown -> HR ticks
 * conflicts to apply -> "Apply selected & commit" re-sends the same file +
 * ticked codes -> result panel. Nothing is written until that last step.
 */
export function ImportDialog({ opened, onClose }: ImportDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [selectedCodes, setSelectedCodes] = useState<Set<string>>(new Set());

  const previewMutation = usePreviewImport();
  const commitMutation = useCommitImport();
  const sampleSheet = useSampleSheet();

  function reset() {
    setFile(null);
    setSelectedCodes(new Set());
    previewMutation.reset();
    commitMutation.reset();
  }

  function handleFileChange(nextFile: File | null) {
    setFile(nextFile);
    setSelectedCodes(new Set());
    commitMutation.reset();
    if (nextFile) {
      previewMutation.mutate(nextFile);
    } else {
      previewMutation.reset();
    }
  }

  function handleToggleConflict(employeeCode: string) {
    setSelectedCodes((previous) => {
      const next = new Set(previous);
      if (next.has(employeeCode)) {
        next.delete(employeeCode);
      } else {
        next.add(employeeCode);
      }
      return next;
    });
  }

  function handleToggleAll(checked: boolean) {
    const conflicts = previewMutation.data?.conflicts ?? [];
    setSelectedCodes(checked ? new Set(conflicts.map((row) => row.employeeCode)) : new Set());
  }

  function handleCommit() {
    if (!file) {
      return;
    }
    commitMutation.mutate({ file, applyEmployeeCodes: Array.from(selectedCodes) });
  }

  function handleClose() {
    reset();
    onClose();
  }

  return (
    <Modal opened={opened} onClose={handleClose} title="Import employees" size="xl">
      <Stack gap="md">
        <Group justify="space-between">
          <Text size="sm">Download sample sheet:</Text>
          <Group gap="sm">
            <Anchor component="button" type="button" onClick={() => void sampleSheet.download('xlsx')}>
              .xlsx
            </Anchor>
            <Anchor component="button" type="button" onClick={() => void sampleSheet.download('csv')}>
              .csv
            </Anchor>
          </Group>
        </Group>

        <FileInput
          label="Select a file to import"
          placeholder="Choose a .csv or .xlsx file"
          accept=".csv,.xlsx"
          value={file}
          onChange={handleFileChange}
          clearable
          disabled={previewMutation.isPending || commitMutation.isPending}
        />

        {previewMutation.isPending && <Text size="sm">Analyzing file…</Text>}
        {previewMutation.isError && (
          <Text size="sm" c="red">
            Could not read this file. Check the format and try again.
          </Text>
        )}

        {previewMutation.data && !commitMutation.data && (
          <>
            <ImportPreviewPanel
              preview={previewMutation.data}
              selectedCodes={selectedCodes}
              onToggleConflict={handleToggleConflict}
              onToggleAll={handleToggleAll}
            />
            <Group justify="flex-end">
              <Button onClick={handleCommit} loading={commitMutation.isPending}>
                Apply selected &amp; commit
              </Button>
            </Group>
          </>
        )}

        {commitMutation.data && <ImportResultPanel report={commitMutation.data} />}
      </Stack>
    </Modal>
  );
}
