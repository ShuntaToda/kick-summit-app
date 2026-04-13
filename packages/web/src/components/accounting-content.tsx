"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, X, ChevronDown, ChevronUp, Calculator } from "lucide-react";
import type { Team } from "@/server/domain/entities/team";
import type { CustomField } from "@/server/domain/entities/event";

type Props = {
  teams: Team[];
  customFields: CustomField[];
  eventFields: CustomField[];
  eventValues: Record<string, string | number>;
};

type OperandType = "field" | "fixed" | "teamCount";
type Operator = "+" | "-" | "×" | "÷";

type Operand = {
  type: OperandType;
  fieldId?: string;
  fixedValue?: number;
};

type FormulaToken =
  | { kind: "operand"; operand: Operand }
  | { kind: "operator"; op: Operator };

function resolveOperand(
  operand: Operand,
  team: Team,
  teamCount: number,
  eventValues: Record<string, string | number>,
): number {
  if (operand.type === "fixed") return operand.fixedValue ?? 0;
  if (operand.type === "teamCount") return teamCount;
  if (operand.type === "field" && operand.fieldId) {
    const ev = eventValues[operand.fieldId];
    if (typeof ev === "number") return ev;
    const v = team.customValues[operand.fieldId];
    return typeof v === "number" ? v : 0;
  }
  return 0;
}

function evaluateFormula(
  tokens: FormulaToken[],
  team: Team,
  teamCount: number,
  eventValues: Record<string, string | number>,
): number {
  const operands: number[] = [];
  const operators: Operator[] = [];
  for (const token of tokens) {
    if (token.kind === "operand") {
      operands.push(resolveOperand(token.operand, team, teamCount, eventValues));
    } else {
      operators.push(token.op);
    }
  }
  if (operands.length === 0) return 0;
  let result = operands[0] ?? 0;
  for (let i = 0; i < operators.length; i++) {
    const rhs = operands[i + 1] ?? 0;
    if (operators[i] === "+") result += rhs;
    else if (operators[i] === "-") result -= rhs;
    else if (operators[i] === "×") result *= rhs;
    else if (operators[i] === "÷") result = rhs !== 0 ? result / rhs : 0;
  }
  return Math.ceil(result);
}

const OPERATORS: Operator[] = ["+", "-", "×", "÷"];

function makeDefaultFormula(): FormulaToken[] {
  return [{ kind: "operand", operand: { type: "fixed", fixedValue: 0 } }];
}

function OperandSelect({
  operand,
  onChange,
  numberFields,
}: {
  operand: Operand;
  onChange: (o: Operand) => void;
  numberFields: CustomField[];
}) {
  const selectValue = operand.type === "field" ? `field:${operand.fieldId}` : operand.type;

  function handleTypeChange(v: string) {
    if (v === "fixed") {
      onChange({ type: "fixed", fixedValue: 0 });
    } else if (v === "teamCount") {
      onChange({ type: "teamCount" });
    } else if (v.startsWith("field:")) {
      const fieldId = v.replace("field:", "");
      onChange({ type: "field", fieldId, fixedValue: 0 });
    }
  }

  return (
    <div className="flex gap-1">
      <Select value={selectValue} onValueChange={handleTypeChange}>
        <SelectTrigger className="w-32 text-xs h-8">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="fixed">固定値</SelectItem>
          <SelectItem value="teamCount">チーム数</SelectItem>
          {numberFields.map((f) => (
            <SelectItem key={f.id} value={`field:${f.id}`}>
              {f.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {operand.type === "fixed" && (
        <Input
          type="number"
          className="w-24 h-8 text-xs"
          value={operand.fixedValue ?? 0}
          onChange={(e) => onChange({ ...operand, fixedValue: Number(e.target.value) })}
        />
      )}
    </div>
  );
}

function CostSimulator({
  teams,
  customFields,
  eventFields,
  eventValues,
}: {
  teams: Team[];
  customFields: CustomField[];
  eventFields: CustomField[];
  eventValues: Record<string, string | number>;
}) {
  const teamNumberFields = customFields.filter((f) => f.type === "number");
  const eventNumberFields = eventFields.filter((f) => f.type === "number");
  const numberFields = [...eventNumberFields, ...teamNumberFields];
  const [open, setOpen] = useState(false);
  const [tokens, setTokens] = useState<FormulaToken[]>(() => makeDefaultFormula());

  const teamCount = teams.length;

  function updateOperandDirect(index: number, operand: Operand) {
    setTokens(tokens.map((t, i) => (i === index && t.kind === "operand" ? { kind: "operand", operand } : t)));
  }

  function updateOperator(index: number, op: Operator) {
    setTokens(tokens.map((t, i) => (i === index && t.kind === "operator" ? { kind: "operator", op } : t)));
  }

  function addOperand() {
    setTokens([
      ...tokens,
      { kind: "operator", op: "+" },
      { kind: "operand", operand: { type: "fixed", fixedValue: 0 } },
    ]);
  }

  function removeLastOperand() {
    if (tokens.length <= 1) return;
    setTokens(tokens.slice(0, -2));
  }

  const rows = teams.map((team) => ({
    team,
    total: evaluateFormula(tokens, team, teamCount, eventValues),
  }));
  const grandTotal = rows.reduce((sum, r) => sum + r.total, 0);

  function formulaLabel(): string {
    return tokens
      .map((t) => {
        if (t.kind === "operator") return t.op;
        const o = t.operand;
        if (o.type === "fixed") return String(o.fixedValue ?? 0);
        if (o.type === "teamCount") return "チーム数";
        const f = numberFields.find((f) => f.id === o.fieldId);
        return f?.label ?? "?";
      })
      .join(" ");
  }

  return (
    <Card>
      <CardContent className="py-0">
        <button
          type="button"
          className="flex w-full items-center justify-between py-3"
          onClick={() => setOpen((v) => !v)}
        >
          <div className="flex items-center gap-2">
            <Calculator className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">費用シミュレーター</span>
          </div>
          {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </button>
        {open && (
          <div className="space-y-4 border-t pb-4 pt-3">
            <div className="space-y-2">
              <Label className="text-xs">計算式（チームごとの支払額）</Label>
              <div className="flex flex-col items-start gap-1">
                {tokens.map((token, i) =>
                  token.kind === "operand" ? (
                    <OperandSelect
                      key={i}
                      operand={token.operand}
                      onChange={(o) => updateOperandDirect(i, o)}
                      numberFields={numberFields}
                    />
                  ) : (
                    <Select
                      key={i}
                      value={token.op}
                      onValueChange={(v) => updateOperator(i, v as Operator)}
                    >
                      <SelectTrigger className="w-16 h-8 text-sm font-bold">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {OPERATORS.map((op) => (
                          <SelectItem key={op} value={op}>{op}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ),
                )}
                <div className="flex gap-2 pt-1">
                  <Button type="button" size="sm" variant="outline" onClick={addOperand}>
                    <Plus className="mr-1 h-3 w-3" />
                    追加
                  </Button>
                  {tokens.length > 1 && (
                    <Button type="button" size="sm" variant="ghost" onClick={removeLastOperand}>
                      <X className="mr-1 h-3 w-3" />
                      削除
                    </Button>
                  )}
                </div>
              </div>
              <p className="text-xs text-muted-foreground">= {formulaLabel()}</p>
            </div>
            <Separator />
            <div className="divide-y">
              {rows.map(({ team, total }) => (
                <div key={team.id} className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: team.color }}
                    />
                    <span className="text-sm">{team.name}</span>
                  </div>
                  <span className="text-sm font-bold">{total.toLocaleString()}円</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between border-t pt-2">
              <span className="text-sm font-medium">合計徴収額</span>
              <span className="text-sm font-bold">{grandTotal.toLocaleString()}円</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function CustomFieldSummary({
  teams,
  customFields,
}: {
  teams: Team[];
  customFields: CustomField[];
}) {
  const [openFields, setOpenFields] = useState<Set<string>>(new Set());
  const numberFields = customFields.filter((f) => f.type === "number");
  const textFields = customFields.filter((f) => f.type === "text");

  function toggle(fieldId: string) {
    setOpenFields((prev) => {
      const next = new Set(prev);
      if (next.has(fieldId)) next.delete(fieldId);
      else next.add(fieldId);
      return next;
    });
  }

  return (
    <div className="space-y-2">
      {numberFields.map((field) => {
        const total = teams.reduce((sum, t) => {
          const v = t.customValues[field.id];
          return sum + (typeof v === "number" ? v : 0);
        }, 0);
        const open = openFields.has(field.id);
        return (
          <Card key={field.id}>
            <CardContent className="py-0">
              <button
                type="button"
                className="flex w-full items-center justify-between py-3"
                onClick={() => toggle(field.id)}
              >
                <span className="text-sm font-medium">{field.label}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold">合計: {total}</span>
                  {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                </div>
              </button>
              {open && (
                <div className="divide-y border-t pb-2">
                  {teams.map((team) => {
                    const v = team.customValues[field.id];
                    const n = typeof v === "number" ? v : 0;
                    return (
                      <div key={team.id} className="flex items-center justify-between py-1.5">
                        <div className="flex items-center gap-2">
                          <span
                            className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                            style={{ backgroundColor: team.color }}
                          />
                          <span className="text-sm">{team.name}</span>
                        </div>
                        <span className="text-sm tabular-nums">{n}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
      {textFields.map((field) => {
        const open = openFields.has(field.id);
        return (
          <Card key={field.id}>
            <CardContent className="py-0">
              <button
                type="button"
                className="flex w-full items-center justify-between py-3"
                onClick={() => toggle(field.id)}
              >
                <span className="text-sm font-medium">{field.label}</span>
                {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
              </button>
              {open && (
                <div className="divide-y border-t pb-2">
                  {teams.map((team) => {
                    const v = team.customValues[field.id];
                    return (
                      <div key={team.id} className="flex items-center justify-between py-1.5">
                        <div className="flex items-center gap-2">
                          <span
                            className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                            style={{ backgroundColor: team.color }}
                          />
                          <span className="text-sm">{team.name}</span>
                        </div>
                        <span className="text-sm text-muted-foreground">{v ?? "—"}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

export function AccountingContent({ teams, customFields, eventFields, eventValues }: Props) {
  return (
    <div className="space-y-6">
      {eventFields.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-medium text-muted-foreground">大会カスタム項目</h2>
          <Card>
            <CardContent className="divide-y py-0">
              {eventFields.map((field) => {
                const v = eventValues[field.id];
                return (
                  <div key={field.id} className="flex items-center justify-between py-3">
                    <span className="text-sm">{field.label}</span>
                    <span className="text-sm font-bold">
                      {v !== undefined && v !== "" ? (
                        field.type === "number" ? Number(v).toLocaleString() : String(v)
                      ) : "—"}
                    </span>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </section>
      )}
      {customFields.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-medium text-muted-foreground">チームカスタム項目</h2>
          <CustomFieldSummary teams={teams} customFields={customFields} />
        </section>
      )}
      <section className="space-y-2">
        <h2 className="text-sm font-medium text-muted-foreground">費用シミュレーター</h2>
        <CostSimulator
          teams={teams}
          customFields={customFields}
          eventFields={eventFields}
          eventValues={eventValues}
        />
      </section>
    </div>
  );
}
