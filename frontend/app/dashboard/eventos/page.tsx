"use client"
import { Button, Card, DateField, DateRangePicker, Label, ListBox, RangeCalendar, SearchField, Select, Separator, Surface } from "@heroui/react";

export default function Event() {
    return (
        <div className="">
            <div className="m-5">
                <Surface className="flex flex-wrap lg:flex-row lg:flex-nowrap gap-4 max-w-100% rounded-xl p-3 items-start" variant="secondary">
                    <SearchField name="search" className="gap-2 w-[100%] md:w-[45%] lg:w-[50%]">
                        <Label>Procurar</Label>
                        <SearchField.Group className="">
                            <SearchField.SearchIcon />
                            <SearchField.Input placeholder="Nome do evento..." />
                            <SearchField.ClearButton />
                        </SearchField.Group>
                    </SearchField>
                    <Select className="w-[100%] md:w-[45%] lg:w-[50%] gap-2" placeholder="Selecione um curso">
                        <Label>Curso</Label>
                        <Select.Trigger>
                            <Select.Value />
                            <Select.Indicator />
                        </Select.Trigger>
                        <Select.Popover>
                            <ListBox>
                                <ListBox.Item id="science-computer" textValue="Ciência da Computação">
                                    Ciência da Computação
                                    <ListBox.ItemIndicator />
                                </ListBox.Item>
                                <ListBox.Item id="administration" textValue="Administração">
                                    Administração
                                    <ListBox.ItemIndicator />
                                </ListBox.Item>
                                <ListBox.Item id="law" textValue="Direito">
                                    Direito
                                    <ListBox.ItemIndicator />
                                </ListBox.Item>
                                <ListBox.Item id="engineering" textValue="Engenharia">
                                    Engenharia
                                    <ListBox.ItemIndicator />
                                </ListBox.Item>
                                <ListBox.Item id="nursing" textValue="Emfermagem">
                                    Emfermagem
                                    <ListBox.ItemIndicator />
                                </ListBox.Item>
                                <ListBox.Item id="physiotherapy" textValue="Fisioterapia">
                                    Fisioterapia
                                    <ListBox.ItemIndicator />
                                </ListBox.Item>
                            </ListBox>
                        </Select.Popover>
                    </Select>
                    <Select className="w-[100%] md:w-[45%] lg:w-[50%] gap-2" placeholder="Selecione um turno">
                        <Label>Turno</Label>
                        <Select.Trigger>
                            <Select.Value />
                            <Select.Indicator />
                        </Select.Trigger>
                        <Select.Popover>
                            <ListBox>
                                <ListBox.Item id="morning" textValue="Manhã">
                                    Manhã
                                    <ListBox.ItemIndicator />
                                </ListBox.Item>
                                <ListBox.Item id="night" textValue="Noite">
                                    Noite
                                    <ListBox.ItemIndicator />
                                </ListBox.Item>
                            </ListBox>
                        </Select.Popover>
                    </Select>
                    <DateRangePicker className="w-[100%] md:w-[45%] lg:w-[50%] gap-2" endName="endDate" startName="startDate">
                        <Label>Data</Label>
                        <DateField.Group fullWidth>
                            <DateField.Input slot="start">
                                {(segment) => <DateField.Segment segment={segment} />}
                            </DateField.Input>
                            <DateRangePicker.RangeSeparator />
                            <DateField.Input slot="end">
                                {(segment) => <DateField.Segment segment={segment} />}
                            </DateField.Input>
                            <DateField.Suffix>
                                <DateRangePicker.Trigger>
                                    <DateRangePicker.TriggerIndicator />
                                </DateRangePicker.Trigger>
                            </DateField.Suffix>
                        </DateField.Group>
                        <DateRangePicker.Popover>
                            <RangeCalendar aria-label="Data">
                                <RangeCalendar.Header>
                                    <RangeCalendar.YearPickerTrigger>
                                        <RangeCalendar.YearPickerTriggerHeading />
                                        <RangeCalendar.YearPickerTriggerIndicator />
                                    </RangeCalendar.YearPickerTrigger>
                                    <RangeCalendar.NavButton slot="previous" />
                                    <RangeCalendar.NavButton slot="next" />
                                </RangeCalendar.Header>
                                <RangeCalendar.Grid>
                                    <RangeCalendar.GridHeader>
                                        {(day) => <RangeCalendar.HeaderCell>{day}</RangeCalendar.HeaderCell>}
                                    </RangeCalendar.GridHeader>
                                    <RangeCalendar.GridBody>
                                        {(date) => <RangeCalendar.Cell date={date} />}
                                    </RangeCalendar.GridBody>
                                </RangeCalendar.Grid>
                                <RangeCalendar.YearPickerGrid>
                                    <RangeCalendar.YearPickerGridBody>
                                        {({ year }) => <RangeCalendar.YearPickerCell year={year} />}
                                    </RangeCalendar.YearPickerGridBody>
                                </RangeCalendar.YearPickerGrid>
                            </RangeCalendar>
                        </DateRangePicker.Popover>
                    </DateRangePicker>
                    <Button className="gap-2 self-end">
                        Buscar
                    </Button>
                </Surface>
            </div>
            <div className="flex flex-wrap md:flow-col items-center justify-center">
                <Separator className="invisible lg:visible max-w-[80%] lg:max-w-[35%]"/>
                <h2 className="text-3xl m-10 subpixel-antialiased font-bold">Lista de Eventos</h2>
                <Separator className="max-w-[80%] lg:max-w-[35%]"/>
            </div>
            <div className="flex flex-wrap gap-4 m-5 justify-center">
                <Card className="w-[100%] md:max-w-[350px] md:min-w-[200px] md:max-h-[350px] md:min-h-[200px] gap-2">
                    <img
                        alt="Indie Hackers community"
                        className="w-[100%] h-[70%] rounded-md "
                        loading="lazy"
                        src="https://heroui-assets.nyc3.cdn.digitaloceanspaces.com/docs/demo1.jpg"
                    />
                    <Card.Header>
                        <Card.Title>Indie Hackers</Card.Title>
                        <Card.Description className="truncate">AAAA</Card.Description>
                    </Card.Header>
                    <Card.Footer className="flex gap-2">
                        <Button className="">Inscreva-se</Button>
                    </Card.Footer>
                </Card>
                <Card className="w-[100%] md:max-w-[350px] md:min-w-[200px] md:max-h-[350px] md:min-h-[200px] gap-2">
                    <img
                        alt="Indie Hackers community"
                        className="w-[100%] h-[70%] rounded-md "
                        loading="lazy"
                        src="https://heroui-assets.nyc3.cdn.digitaloceanspaces.com/docs/demo1.jpg"
                    />
                    <Card.Header>
                        <Card.Title>Indie Hackers</Card.Title>
                        <Card.Description className="truncate">AAAA</Card.Description>
                    </Card.Header>
                    <Card.Footer className="flex gap-2">
                        <Button className="">Inscreva-se</Button>
                    </Card.Footer>
                </Card>
                <Card className="w-[100%] md:max-w-[350px] md:min-w-[200px] md:max-h-[350px] md:min-h-[200px] gap-2">
                    <img
                        alt="Indie Hackers community"
                        className="w-[100%] h-[70%] rounded-md "
                        loading="lazy"
                        src="https://heroui-assets.nyc3.cdn.digitaloceanspaces.com/docs/demo1.jpg"
                    />
                    <Card.Header>
                        <Card.Title>Indie Hackers</Card.Title>
                        <Card.Description className="truncate">AAAA</Card.Description>
                    </Card.Header>
                    <Card.Footer className="flex gap-2">
                        <Button className="">Inscreva-se</Button>
                    </Card.Footer>
                </Card>
                <Card className="w-[100%] md:max-w-[350px] md:min-w-[200px] md:max-h-[350px] md:min-h-[200px] gap-2">
                    <img
                        alt="Indie Hackers community"
                        className="w-[100%] h-[70%] rounded-md "
                        loading="lazy"
                        src="https://heroui-assets.nyc3.cdn.digitaloceanspaces.com/docs/demo1.jpg"
                    />
                    <Card.Header>
                        <Card.Title>Indie Hackers</Card.Title>
                        <Card.Description className="truncate">AAAA</Card.Description>
                    </Card.Header>
                    <Card.Footer className="flex gap-2">
                        <Button className="">Inscreva-se</Button>
                    </Card.Footer>
                </Card>
                <Card className="w-[100%] md:max-w-[350px] md:min-w-[200px] md:max-h-[350px] md:min-h-[200px] gap-2">
                    <img
                        alt="Indie Hackers community"
                        className="w-[100%] h-[70%] rounded-md "
                        loading="lazy"
                        src="https://heroui-assets.nyc3.cdn.digitaloceanspaces.com/docs/demo1.jpg"
                    />
                    <Card.Header>
                        <Card.Title>Indie Hackers</Card.Title>
                        <Card.Description className="truncate">AAAA</Card.Description>
                    </Card.Header>
                    <Card.Footer className="flex gap-2">
                        <Button className="">Inscreva-se</Button>
                    </Card.Footer>
                </Card>
                <Card className="w-[100%] md:max-w-[350px] md:min-w-[200px] md:max-h-[350px] md:min-h-[200px] gap-2">
                    <img
                        alt="Indie Hackers community"
                        className="w-[100%] h-[70%] rounded-md "
                        loading="lazy"
                        src="https://heroui-assets.nyc3.cdn.digitaloceanspaces.com/docs/demo1.jpg"
                    />
                    <Card.Header>
                        <Card.Title>Indie Hackers</Card.Title>
                        <Card.Description className="truncate">AAAA</Card.Description>
                    </Card.Header>
                    <Card.Footer className="flex gap-2">
                        <Button className="">Inscreva-se</Button>
                    </Card.Footer>
                </Card>

            </div>
        </div >
    )
}