"use client";

import { useState } from "react";
import {
  Button,
  DateField,
  FieldError,
  Form,
  Input,
  Label,
  ListBox,
  Select,
  Surface,
  TextArea,
  TextField,
} from "@heroui/react";
import { IconPhoto, IconX, IconDeviceFloppy } from "@tabler/icons-react";
import { coursesItems } from "@/lib/types/courses";
import { EventItem } from "@/lib/types/events";
import { parseDate } from "@internationalized/date";

interface EditEventFormProps {
  evento: EventItem;
  onSubmit?: (data: Record<string, string>) => void;
}

export function EditEventForm({ evento, onSubmit }: EditEventFormProps) {
  const [bannerUrl, setBannerUrl] = useState(evento.banner);
  const [bannerValid, setBannerValid] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formKey, setFormKey] = useState(0);

  const defaultDate = parseDate(
    new Date(evento.date).toISOString().split("T")[0]
  );

  const handleBannerChange = (value: string) => {
    setBannerUrl(value);
    setBannerValid(/^https?:\/\/.+\.(jpg|jpeg|png|webp|gif|svg)(\?.*)?$/i.test(value));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);

    const formData = new FormData(e.currentTarget);
    const data: Record<string, string> = {};
    formData.forEach((value, key) => {
      data[key] = value.toString();
    });

    await new Promise((r) => setTimeout(r, 800));
    setSaving(false);
    onSubmit?.(data);
  };

  return (
    <Surface variant="secondary" className="rounded-2xl p-5">
      <Form
        key={formKey}
        className="flex w-full flex-col gap-4"
        onSubmit={handleSubmit}
      >
        <div className="flex flex-col sm:flex-row gap-4 w-full">
          <TextField
            name="name"
            type="text"
            className="flex-1"
            defaultValue={evento.name}
            isRequired
            validate={(value) => {
              if (!value.trim()) return "Nome é obrigatório";
              if (value.trim().length < 3) return "Mínimo de 3 caracteres";
              return null;
            }}
          >
            <Label>Nome</Label>
            <Input placeholder="Nome do evento" />
            <FieldError />
          </TextField>

          <DateField
            className="flex-1"
            name="date"
            defaultValue={defaultDate}
            isRequired
          >
            <Label>Data</Label>
            <DateField.Group>
              <DateField.Input>
                {(segment) => <DateField.Segment segment={segment} />}
              </DateField.Input>
            </DateField.Group>
            <FieldError />
          </DateField>
        </div>

        <div className="flex flex-col gap-2 w-full">
          <TextField
            name="banner"
            type="url"
            className="w-full"
            value={bannerUrl}
            onChange={handleBannerChange}
            validate={(value) => {
              if (!value.trim()) return null;
              if (!/^https?:\/\/.+/i.test(value)) return "Insira uma URL válida";
              return null;
            }}
          >
            <Label>Banner</Label>
            <Input placeholder="https://exemplo.com/imagem.jpg" />
            <FieldError />
          </TextField>

          {bannerUrl && bannerValid ? (
            <div className="relative w-full h-36 rounded-lg overflow-hidden border border-separator">
              <img
                src={bannerUrl}
                alt="Preview do banner"
                className="w-full h-full object-cover"
                onError={() => setBannerValid(false)}
              />
              <button
                type="button"
                onClick={() => { setBannerUrl(""); setBannerValid(false); }}
                className="absolute top-2 right-2 bg-black/50 rounded-full p-1 text-white hover:bg-black/70 transition-colors"
              >
                <IconX size={14} />
              </button>
            </div>
          ) : bannerUrl && !bannerValid ? (
            <div className="w-full h-36 rounded-lg border border-separator bg-default-100 flex flex-col items-center justify-center gap-2 text-default-400">
              <IconPhoto size={28} />
              <span className="text-xs">URL inválida ou imagem não encontrada</span>
            </div>
          ) : null}
        </div>

        <TextField
          name="description"
          className="w-full"
          defaultValue={evento.description}
          isRequired
          validate={(value) => {
            if (!value.trim()) return "Descrição é obrigatória";
            if (value.trim().length < 10) return "Mínimo de 10 caracteres";
            return null;
          }}
        >
          <Label>Descrição</Label>
          <TextArea placeholder="Descreva o evento..." rows={3} />
          <FieldError />
        </TextField>

        <div className="flex flex-col sm:flex-row gap-4 w-full">
          <TextField
            name="local"
            type="text"
            className="flex-1"
            defaultValue={evento.local}
            isRequired
            validate={(value) => {
              if (!value.trim()) return "Local é obrigatório";
              return null;
            }}
          >
            <Label>Local</Label>
            <Input placeholder="Ex: Bloco A — Auditório" />
            <FieldError />
          </TextField>

          <TextField
            name="vagas"
            type="number"
            className="sm:w-36"
            defaultValue={String(evento.vagas)}
            isRequired
            validate={(value) => {
              const n = Number(value);
              if (!value) return "Obrigatório";
              if (!Number.isInteger(n) || n <= 0) return "Número inteiro positivo";
              if (n < evento.vagasOcupadas)
                return `Mínimo ${evento.vagasOcupadas} (já inscritos)`;
              if (n > 9999) return "Máximo 9999 vagas";
              return null;
            }}
          >
            <Label>Vagas</Label>
            <Input placeholder="Ex: 100" min={evento.vagasOcupadas} max={9999} />
            <FieldError />
          </TextField>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 w-full">
          <div className="flex flex-col gap-1.5 flex-1">
            <Label className="text-sm">Curso</Label>
            <Select
              name="curso"
              className="w-full"
              placeholder="Selecione um curso"
              defaultSelectedKey={
                coursesItems.find((c) => c.name === evento.curso)?.key
              }
            >
              <Select.Trigger>
                <Select.Value />
                <Select.Indicator />
              </Select.Trigger>
              <Select.Popover>
                <ListBox>
                  {coursesItems.map((item) => (
                    <ListBox.Item key={item.key} id={item.key} textValue={item.name}>
                      {item.name}
                      <ListBox.ItemIndicator />
                    </ListBox.Item>
                  ))}
                </ListBox>
              </Select.Popover>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5 sm:w-44">
            <Label className="text-sm">Turno</Label>
            <Select
              name="turno"
              className="w-full"
              placeholder="Selecione um turno"
              defaultSelectedKey={evento.turno === "Manhã" ? "morning" : "night"}
            >
              <Select.Trigger>
                <Select.Value />
                <Select.Indicator />
              </Select.Trigger>
              <Select.Popover>
                <ListBox>
                  <ListBox.Item id="morning" textValue="Manhã">
                    Manhã <ListBox.ItemIndicator />
                  </ListBox.Item>
                  <ListBox.Item id="night" textValue="Noite">
                    Noite <ListBox.ItemIndicator />
                  </ListBox.Item>
                </ListBox>
              </Select.Popover>
            </Select>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="primary"
            onPress={() => setFormKey((k) => k + 1)}
          >
            Resetar
          </Button>
          <Button
            type="submit"
            variant="primary"
            isPending={saving}
          >
            {!saving && <IconDeviceFloppy size={16} />}
            {saving ? "Salvando..." : "Salvar alterações"}
          </Button>
        </div>
      </Form>
    </Surface>
  );
}